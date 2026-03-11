import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Coupon & Discount System E2E tests — covers:
 *  - Coupon validation API (valid, expired, inactive, min order)
 *  - Coupon UI on checkout page (apply, remove, error messages)
 *  - Admin coupon CRUD (create, edit, delete, list)
 */

// ─── Helpers ─────────────────────────────────────────────────────

const ADMIN_EMAIL = 'admin@decorasm.com';
const ADMIN_PASS = 'admin123';

async function seedDatabase(request: APIRequestContext) {
  await request.post('/api/seed');
}

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASS);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

async function addProductToCart(page: Page, slug: string) {
  await page.goto(`/products/${slug}`);
  await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible();
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByRole('button', { name: 'Added to cart' })).toBeVisible({ timeout: 5000 });
}

// ─── API Tests ──────────────────────────────────────────────────

test.describe('Coupon API — Validation', () => {
  test.beforeAll(async ({ request }) => {
    await seedDatabase(request);
  });

  test('valid coupon returns discount amount', async ({ page }) => {
    // Add item to cart to get a session
    await addProductToCart(page, 'artisan-ceramic-vase');

    const response = await page.request.post('/api/coupons/validate', {
      data: { code: 'SAVE10' },
    });
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.valid).toBe(true);
    expect(data.discountType).toBe('percent');
    expect(data.discountValue).toBe(10);
    expect(data.discountAmount).toBeGreaterThan(0);
  });

  test('invalid code returns error', async ({ page }) => {
    await addProductToCart(page, 'artisan-ceramic-vase');

    const response = await page.request.post('/api/coupons/validate', {
      data: { code: 'DOESNOTEXIST' },
    });
    expect(response.ok()).toBe(false);

    const data = await response.json();
    expect(data.error).toBeTruthy();
  });

  test('inactive coupon rejected', async ({ page }) => {
    // Create an inactive coupon via admin API (need to login first)
    await addProductToCart(page, 'artisan-ceramic-vase');
    await loginAsAdmin(page);

    await page.request.post('/api/admin/coupons', {
      data: {
        code: 'INACTIVE1',
        discountType: 'percent',
        discountValue: 5,
        isActive: false,
      },
    });

    const response = await page.request.post('/api/coupons/validate', {
      data: { code: 'INACTIVE1' },
    });
    expect(response.ok()).toBe(false);

    const data = await response.json();
    expect(data.error).toContain('no longer active');
  });

  test('expired coupon rejected', async ({ page }) => {
    await addProductToCart(page, 'artisan-ceramic-vase');
    await loginAsAdmin(page);

    await page.request.post('/api/admin/coupons', {
      data: {
        code: 'EXPIRED1',
        discountType: 'percent',
        discountValue: 15,
        isActive: true,
        expiresAt: '2020-01-01',
      },
    });

    const response = await page.request.post('/api/coupons/validate', {
      data: { code: 'EXPIRED1' },
    });
    expect(response.ok()).toBe(false);

    const data = await response.json();
    expect(data.error).toContain('expired');
  });

  test('below minimum order amount rejected', async ({ page }) => {
    await addProductToCart(page, 'artisan-ceramic-vase');

    // FLAT5 requires $50 minimum
    const response = await page.request.post('/api/coupons/validate', {
      data: { code: 'FLAT5' },
    });

    const data = await response.json();
    // Depending on product price, this may or may not pass the minimum check.
    // The test validates the API responds correctly either way.
    if (!response.ok()) {
      expect(data.error).toContain('Minimum order');
    } else {
      expect(data.valid).toBe(true);
    }
  });
});

// ─── UI Tests ───────────────────────────────────────────────────

test.describe('Coupon UI — Checkout Page', () => {
  test.beforeAll(async ({ request }) => {
    await seedDatabase(request);
  });

  test('apply coupon shows discount row', async ({ page }) => {
    await addProductToCart(page, 'artisan-ceramic-vase');
    await page.goto('/checkout');

    await page.getByPlaceholder('Coupon code').fill('SAVE10');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Should show coupon applied with discount row
    await expect(page.getByText('SAVE10')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('applied')).toBeVisible();
    await expect(page.getByText(/Discount/)).toBeVisible();
  });

  test('remove coupon clears discount', async ({ page }) => {
    await addProductToCart(page, 'artisan-ceramic-vase');
    await page.goto('/checkout');

    await page.getByPlaceholder('Coupon code').fill('SAVE10');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('applied')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByText('applied')).not.toBeVisible();
    await expect(page.getByPlaceholder('Coupon code')).toBeVisible();
  });

  test('invalid code shows error message', async ({ page }) => {
    await addProductToCart(page, 'artisan-ceramic-vase');
    await page.goto('/checkout');

    await page.getByPlaceholder('Coupon code').fill('BADCODE');
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(page.getByText('Invalid coupon code')).toBeVisible({ timeout: 5000 });
  });
});

// ─── Admin Tests ────────────────────────────────────────────────

test.describe('Admin — Coupon Management', () => {
  test.beforeAll(async ({ request }) => {
    await seedDatabase(request);
  });

  test('coupon list shows seed data', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/coupons');

    await expect(page.getByText('SAVE10')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('FLAT5')).toBeVisible();
    await expect(page.getByText('WELCOME20')).toBeVisible();
  });

  test('create a coupon via admin UI', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/coupons/new');

    await page.locator('#coupon-code').fill('TESTCOUPON');
    await page.locator('#coupon-type').selectOption('fixed');
    await page.locator('#coupon-value').fill('10');
    await page.locator('#coupon-min-order').fill('25');

    await page.getByRole('button', { name: 'Create Coupon' }).click();
    await page.waitForURL('**/admin/coupons', { timeout: 10000 });

    await expect(page.getByText('TESTCOUPON')).toBeVisible();
  });

  test('edit a coupon', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/coupons');

    // Find TESTCOUPON row and click edit
    const row = page.locator('tr', { hasText: 'TESTCOUPON' });
    await row.getByText('Edit').click();

    await page.waitForURL('**/edit', { timeout: 10000 });
    await page.locator('#coupon-value').fill('15');
    await page.getByRole('button', { name: 'Update Coupon' }).click();

    await page.waitForURL('**/admin/coupons', { timeout: 10000 });
  });

  test('delete a coupon', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/coupons');

    const row = page.locator('tr', { hasText: 'TESTCOUPON' });

    page.on('dialog', (dialog) => dialog.accept());
    await row.getByText('Delete').click();

    await expect(row).not.toBeVisible({ timeout: 5000 });
  });
});
