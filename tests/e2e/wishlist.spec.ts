import { test, expect, type Page } from '@playwright/test';

/**
 * Wishlist E2E tests — covers:
 *  - Unauthenticated: heart click redirects to login
 *  - Product card: heart toggle adds/removes from wishlist
 *  - Product detail: heart toggle adds/removes from wishlist
 *  - Wishlist page: displays wishlisted items, remove button, add-to-cart
 *  - Navbar: wishlist icon with count badge
 *  - API validation: unauthenticated access returns 401
 */

const PRODUCT = { slug: 'linen-cushion-cover-set', name: 'Linen Cushion Cover Set' };

/** Register a user via API. */
async function registerUser(request: Page['request']) {
  const user = {
    name: 'Wishlist Tester',
    email: `wishlist+${Date.now()}@example.com`,
    password: 'WishlistPass1!',
  };
  await request.post('/api/auth/register', {
    data: { name: user.name, email: user.email, password: user.password },
  });
  return user;
}

/** Login via UI. */
async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).not.toHaveURL('/login', { timeout: 10000 });
}

/** Register + login, return user info. */
async function createAndLoginUser(page: Page) {
  const user = await registerUser(page.request);
  await loginViaUI(page, user.email, user.password);
  return user;
}

// ── Unauthenticated ────────────────────────────────────────────────────────

test.describe('Wishlist — unauthenticated', () => {
  test('clicking heart on product card redirects to /login', async ({ page }) => {
    await page.goto('/products');
    // Wait for product cards to load
    const heartButton = page.getByLabel('Add to wishlist').first();
    await expect(heartButton).toBeVisible({ timeout: 10000 });
    await heartButton.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('clicking heart on product detail redirects to /login', async ({ page }) => {
    await page.goto(`/products/${PRODUCT.slug}`);
    const heartButton = page.getByLabel('Add to wishlist');
    await expect(heartButton).toBeVisible({ timeout: 10000 });
    await heartButton.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

// ── Product card wishlist toggle ───────────────────────────────────────────

test.describe('Wishlist — product card', () => {
  test('heart button toggles between add and remove', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/products');

    // Wait for session to hydrate (wishlist icon in navbar)
    await expect(page.getByLabel(/Wishlist/)).toBeVisible({ timeout: 10000 });

    // Find the first heart button
    const heartButton = page.getByLabel('Add to wishlist').first();
    await expect(heartButton).toBeVisible({ timeout: 10000 });

    // Click to add to wishlist
    await heartButton.click();
    await expect(page.getByLabel('Remove from wishlist').first()).toBeVisible({ timeout: 5000 });

    // Click again to remove
    await page.getByLabel('Remove from wishlist').first().click();
    await expect(page.getByLabel('Add to wishlist').first()).toBeVisible({ timeout: 5000 });
  });
});

// ── Product detail wishlist toggle ─────────────────────────────────────────

test.describe('Wishlist — product detail', () => {
  test('heart button toggles on product detail page', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto(`/products/${PRODUCT.slug}`);

    // Wait for session to hydrate
    await expect(page.getByLabel(/Wishlist/)).toBeVisible({ timeout: 10000 });

    const heartButton = page.getByLabel('Add to wishlist');
    await expect(heartButton).toBeVisible({ timeout: 10000 });

    // Add to wishlist
    await heartButton.click();
    await expect(page.getByLabel('Remove from wishlist')).toBeVisible({ timeout: 5000 });

    // Remove from wishlist
    await page.getByLabel('Remove from wishlist').click();
    await expect(page.getByLabel('Add to wishlist')).toBeVisible({ timeout: 5000 });
  });
});

// ── Wishlist page ──────────────────────────────────────────────────────────

test.describe('Wishlist page (/account/wishlist)', () => {
  test('shows empty state when no items wishlisted', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/account/wishlist');

    await expect(page.getByText('Your wishlist is empty')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'Browse Products' })).toBeVisible();
  });

  test('shows wishlisted product after adding from detail page', async ({ page }) => {
    await createAndLoginUser(page);

    // Add product to wishlist — wait for session to hydrate first
    await page.goto(`/products/${PRODUCT.slug}`);
    // Wait for navbar to show user name (session loaded)
    await expect(page.getByLabel(/Wishlist/)).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Add to wishlist').click();
    await expect(page.getByLabel('Remove from wishlist')).toBeVisible({ timeout: 5000 });

    // Visit wishlist page
    await page.goto('/account/wishlist');
    await expect(page.getByText(PRODUCT.name)).toBeVisible({ timeout: 10000 });
  });

  test('remove button removes item from wishlist page', async ({ page }) => {
    await createAndLoginUser(page);

    // Add product to wishlist
    await page.goto(`/products/${PRODUCT.slug}`);
    await expect(page.getByLabel(/Wishlist/)).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Add to wishlist').click();
    await expect(page.getByLabel('Remove from wishlist')).toBeVisible({ timeout: 5000 });

    // Go to wishlist page and remove
    await page.goto('/account/wishlist');
    await expect(page.getByText(PRODUCT.name)).toBeVisible({ timeout: 10000 });

    const removeBtn = page.getByLabel(`Remove ${PRODUCT.name} from wishlist`);
    await expect(removeBtn).toBeVisible({ timeout: 5000 });
    await removeBtn.click();

    // Item should be gone after removal
    await expect(removeBtn).not.toBeVisible({ timeout: 10000 });
  });

  test('Add to Cart button works from wishlist page', async ({ page }) => {
    await createAndLoginUser(page);

    // Add product to wishlist
    await page.goto(`/products/${PRODUCT.slug}`);
    await expect(page.getByLabel(/Wishlist/)).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Add to wishlist').click();
    await expect(page.getByLabel('Remove from wishlist')).toBeVisible({ timeout: 5000 });

    // Go to wishlist page and add to cart
    await page.goto('/account/wishlist');
    await expect(page.getByText(PRODUCT.name)).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Add to Cart' }).click();
    await expect(page.getByRole('button', { name: 'Adding...' })).toBeVisible({ timeout: 3000 });

    // Cart badge should appear in navbar
    await expect(page.locator('a[href="/cart"] span')).toBeVisible({ timeout: 5000 });
  });

  test('sidebar shows Wishlist link', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/account/wishlist');

    await expect(page.getByRole('link', { name: 'Wishlist' })).toBeVisible({ timeout: 10000 });
  });
});

// ── Navbar wishlist icon ───────────────────────────────────────────────────

test.describe('Wishlist — navbar icon', () => {
  test('wishlist icon appears for authenticated users', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/');

    await expect(page.getByLabel(/Wishlist/)).toBeVisible({ timeout: 5000 });
  });

  test('wishlist icon not visible for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel(/Wishlist/)).not.toBeVisible();
  });

  test('wishlist badge shows count after adding item', async ({ page }) => {
    await createAndLoginUser(page);

    // Add product to wishlist
    await page.goto(`/products/${PRODUCT.slug}`);
    await expect(page.getByLabel(/Wishlist/)).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Add to wishlist').click();
    await expect(page.getByLabel('Remove from wishlist')).toBeVisible({ timeout: 5000 });

    // Check navbar badge
    const wishlistLink = page.getByLabel(/Wishlist, 1 item/);
    await expect(wishlistLink).toBeVisible({ timeout: 5000 });
  });
});

// ── API validation ─────────────────────────────────────────────────────────

test.describe('Wishlist API — unauthenticated', () => {
  const BASE = 'http://localhost:3000';

  test('GET /api/wishlist without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/wishlist`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/wishlist without auth returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/wishlist`, {
      data: { productId: 'abc123' },
    });
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/wishlist/abc123 without auth returns 401', async ({ request }) => {
    const res = await request.delete(`${BASE}/api/wishlist/abc123`);
    expect(res.status()).toBe(401);
  });
});
