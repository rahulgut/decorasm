import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Admin Dashboard E2E tests — covers:
 *  - Admin login and access
 *  - Non-admin users redirected away from /admin
 *  - Dashboard overview stats
 *  - Product listing, create, edit, delete
 *  - Order listing and status update
 */

// ─── Helpers ─────────────────────────────────────────────────────

const ADMIN_EMAIL = 'admin@decorasm.com';
const ADMIN_PASS = 'admin123';
const USER_EMAIL = 'testuser-admin@example.com';
const USER_PASS = 'password123';

async function registerUser(request: APIRequestContext) {
  await request.post('/api/auth/register', {
    data: { name: 'Admin Test User', email: USER_EMAIL, password: USER_PASS },
  });
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

async function seedDatabase(request: APIRequestContext) {
  await request.post('/api/seed');
}

// ─── Access Control ──────────────────────────────────────────────

test.describe('Admin — Access Control', () => {
  test.beforeAll(async ({ request }) => {
    await seedDatabase(request);
    await registerUser(request);
  });

  test('unauthenticated users are redirected to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('non-admin users are redirected to home', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await page.goto('/admin');
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('admin users can access /admin', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
  });
});

// ─── Dashboard Overview ──────────────────────────────────────────

test.describe('Admin — Dashboard', () => {
  test.beforeAll(async ({ request }) => {
    await seedDatabase(request);
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);
  });

  test('shows stat cards', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Total Products')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Total Orders')).toBeVisible();
    await expect(page.getByText('Revenue')).toBeVisible();
    await expect(page.getByText('Customers')).toBeVisible();
  });

  test('shows sidebar navigation', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL('/admin/products');
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL('/admin/orders');
  });
});

// ─── Product Management ──────────────────────────────────────────

test.describe('Admin — Products', () => {
  test.beforeAll(async ({ request }) => {
    await seedDatabase(request);
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);
  });

  test('lists products with table', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    // Should have products from seed
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('shows Add Product button', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.getByRole('link', { name: 'Add Product' })).toBeVisible();
  });

  test('can filter products by category', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Filter by category').selectOption('furniture');
    // Table should reload (we just verify it doesn't error)
    await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
  });

  test('can create a new product', async ({ page }) => {
    await page.goto('/admin/products/new');
    await page.getByLabel('Name').fill('Test Product E2E');
    await page.getByLabel('Description').fill('A test product created by E2E tests');
    await page.getByLabel('Price (USD)').fill('29.99');
    await page.getByLabel('Category').selectOption('accessories');
    await page.getByLabel('Material').fill('Test Material');
    await page.getByRole('button', { name: 'Create Product' }).click();

    // Should redirect to product list
    await expect(page).toHaveURL('/admin/products', { timeout: 10000 });
  });

  test('can edit a product', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    // Click first Edit link
    await page.locator('table tbody tr').first().getByText('Edit').click();
    await expect(page).toHaveURL(/\/admin\/products\/.+\/edit/);

    // Modify the name
    const nameInput = page.getByLabel('Name');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    const originalName = await nameInput.inputValue();
    await nameInput.fill(originalName + ' Edited');
    await page.getByRole('button', { name: 'Update Product' }).click();

    await expect(page).toHaveURL('/admin/products', { timeout: 10000 });
  });

  test('can delete a product', async ({ page }) => {
    // First create a product to delete
    await page.goto('/admin/products/new');
    await page.getByLabel('Name').fill('Delete Me Product');
    await page.getByLabel('Description').fill('This product will be deleted');
    await page.getByLabel('Price (USD)').fill('9.99');
    await page.getByLabel('Category').selectOption('accessories');
    await page.getByRole('button', { name: 'Create Product' }).click();
    await expect(page).toHaveURL('/admin/products', { timeout: 10000 });

    // Find and delete it
    await expect(page.getByText('Delete Me Product')).toBeVisible({ timeout: 5000 });

    page.on('dialog', (dialog) => dialog.accept());
    await page.locator('tr', { hasText: 'Delete Me Product' }).getByRole('button', { name: 'Delete' }).click();

    // Product should disappear
    await expect(page.getByText('Delete Me Product')).not.toBeVisible({ timeout: 5000 });
  });
});

// ─── Order Management ────────────────────────────────────────────

test.describe('Admin — Orders', () => {
  test.beforeAll(async ({ request }) => {
    await seedDatabase(request);
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);
  });

  test('lists orders page', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('h2', { hasText: 'Orders' })).toBeVisible({ timeout: 10000 });
  });

  test('can filter orders by status', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page.locator('h2', { hasText: 'Orders' })).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Filter by status').selectOption('pending');
    // Verify filter applied without errors
    await expect(page.locator('h2', { hasText: 'Orders' })).toBeVisible({ timeout: 5000 });
  });
});

// ─── Admin API ───────────────────────────────────────────────────

test.describe('Admin — API protection', () => {
  test('stats API returns 401 for unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/stats');
    expect(res.status()).toBe(401);
  });

  test('products API returns 401 for unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/products');
    expect(res.status()).toBe(401);
  });

  test('orders API returns 401 for unauthenticated', async ({ request }) => {
    const res = await request.get('/api/admin/orders');
    expect(res.status()).toBe(401);
  });
});
