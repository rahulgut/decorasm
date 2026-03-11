import { test, expect, type Page } from '@playwright/test';

/**
 * Wishlist Sharing E2E tests — covers:
 *  - Share button visibility (hidden when empty, visible with items)
 *  - Share link generation and copy
 *  - Stop sharing revokes the link
 *  - Public page renders owner name and products (view-only)
 *  - Invalid token shows 404
 *  - No cart/wishlist action buttons on public page
 *  - API: shared/[token] returns 200/404
 *  - API: share management requires auth
 */

const PRODUCT = { slug: 'linen-cushion-cover-set', name: 'Linen Cushion Cover Set' };
const BASE = 'http://localhost:3000';

async function registerUser(request: Page['request']) {
  const user = {
    name: 'Share Tester',
    email: `share+${Date.now()}+${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'SharePass1!',
  };
  await request.post('/api/auth/register', {
    data: { name: user.name, email: user.email, password: user.password },
  });
  return user;
}

async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).not.toHaveURL('/login', { timeout: 10000 });
}

async function createAndLoginUser(page: Page) {
  const user = await registerUser(page.request);
  await loginViaUI(page, user.email, user.password);
  return user;
}

async function addProductToWishlist(page: Page) {
  await page.goto(`/products/${PRODUCT.slug}`);
  await expect(page.getByLabel(/Wishlist/)).toBeVisible({ timeout: 10000 });
  await page.getByLabel('Add to wishlist').click();
  await expect(page.getByLabel('Remove from wishlist')).toBeVisible({ timeout: 5000 });
}

// ── Share button visibility ──────────────────────────────────────────────

test.describe('Wishlist Share — button visibility', () => {
  test('share button is hidden when wishlist is empty', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/account/wishlist');
    await expect(page.getByText('Your wishlist is empty')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Share Wishlist' })).not.toBeVisible();
  });

  test('share button appears when wishlist has items', async ({ page }) => {
    await createAndLoginUser(page);
    await addProductToWishlist(page);

    await page.goto('/account/wishlist');
    await expect(page.getByText(PRODUCT.name)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Share Wishlist' })).toBeVisible({ timeout: 5000 });
  });
});

// ── Share link generation ────────────────────────────────────────────────

test.describe('Wishlist Share — link generation', () => {
  test('clicking Share Wishlist generates a share link', async ({ page }) => {
    await createAndLoginUser(page);
    await addProductToWishlist(page);

    await page.goto('/account/wishlist');
    await expect(page.getByText(PRODUCT.name)).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Share Wishlist' }).click();

    // Share link input should appear
    const linkInput = page.getByLabel('Share link');
    await expect(linkInput).toBeVisible({ timeout: 5000 });
    const shareUrl = await linkInput.inputValue();
    expect(shareUrl).toMatch(/\/wishlist\/.+/);
  });

  test('Stop Sharing removes the share link', async ({ page }) => {
    await createAndLoginUser(page);
    await addProductToWishlist(page);

    await page.goto('/account/wishlist');
    await expect(page.getByText(PRODUCT.name)).toBeVisible({ timeout: 10000 });

    // Generate link
    await page.getByRole('button', { name: 'Share Wishlist' }).click();
    await expect(page.getByLabel('Share link')).toBeVisible({ timeout: 5000 });

    // Stop sharing
    await page.getByRole('button', { name: 'Stop Sharing' }).click();

    // Share button should reappear
    await expect(page.getByRole('button', { name: 'Share Wishlist' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('Share link')).not.toBeVisible();
  });
});

// ── Public page ──────────────────────────────────────────────────────────

test.describe('Wishlist Share — public page', () => {
  test('public page renders owner name and products', async ({ page }) => {
    const user = await createAndLoginUser(page);
    await addProductToWishlist(page);

    // Generate share link via API
    await page.goto('/account/wishlist');
    await expect(page.getByText(PRODUCT.name)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Share Wishlist' }).click();
    const linkInput = page.getByLabel('Share link');
    await expect(linkInput).toBeVisible({ timeout: 5000 });
    const shareUrl = await linkInput.inputValue();

    // Open shared page (can be same browser — public route)
    await page.goto(shareUrl);
    await expect(page.getByRole('heading', { name: `${user.name}'s Wishlist` })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(PRODUCT.name)).toBeVisible();
  });

  test('invalid token shows 404 page', async ({ page }) => {
    const res = await page.goto('/wishlist/invalid-token-12345');
    expect(res?.status()).toBe(404);
  });

  test('no wishlist/cart action buttons on public page', async ({ page }) => {
    await createAndLoginUser(page);
    await addProductToWishlist(page);

    // Generate share link
    await page.goto('/account/wishlist');
    await expect(page.getByText(PRODUCT.name)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Share Wishlist' }).click();
    const linkInput = page.getByLabel('Share link');
    await expect(linkInput).toBeVisible({ timeout: 5000 });
    const shareUrl = await linkInput.inputValue();

    await page.goto(shareUrl);
    await expect(page.getByText(PRODUCT.name)).toBeVisible({ timeout: 15000 });

    // No Add to Cart or wishlist buttons
    await expect(page.getByRole('button', { name: 'Add to Cart' })).not.toBeVisible();
    await expect(page.getByLabel('Add to wishlist')).not.toBeVisible();
    await expect(page.getByLabel('Remove from wishlist')).not.toBeVisible();
  });
});

// ── API tests ────────────────────────────────────────────────────────────

test.describe('Wishlist Share — API', () => {
  test('GET shared/[valid-token] returns 200 with items', async ({ page, request }) => {
    await createAndLoginUser(page);
    await addProductToWishlist(page);

    // Create share via API (using browser cookies)
    const shareRes = await page.request.post(`${BASE}/api/wishlist/share`);
    expect(shareRes.ok()).toBe(true);
    const { shareUrl } = await shareRes.json();

    // Fetch public endpoint (no auth needed)
    const publicRes = await request.get(`${BASE}/api/wishlist${shareUrl.replace('/wishlist', '/shared')}`);
    expect(publicRes.status()).toBe(200);
    const data = await publicRes.json();
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.ownerName).toBeTruthy();
  });

  test('GET shared/[invalid-token] returns 404', async ({ request }) => {
    const res = await request.get(`${BASE}/api/wishlist/shared/nonexistent-token`);
    expect(res.status()).toBe(404);
  });

  test('share management APIs return 401 without auth', async ({ request }) => {
    const getRes = await request.get(`${BASE}/api/wishlist/share`);
    expect(getRes.status()).toBe(401);

    const postRes = await request.post(`${BASE}/api/wishlist/share`);
    expect(postRes.status()).toBe(401);

    const deleteRes = await request.delete(`${BASE}/api/wishlist/share`);
    expect(deleteRes.status()).toBe(401);
  });
});
