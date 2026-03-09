import { test, expect } from '@playwright/test';

const MOBILE = { width: 390, height: 844 };
const MIN_TAP = 44;

test.describe('Mobile Touch Interactions', () => {
  test.use({ hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
  });

  test('hamburger button meets 44px minimum tap target', async ({ page }) => {
    await page.goto('/');
    const box = await page.getByRole('button', { name: 'Open menu' }).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(MIN_TAP);
    expect(box!.height).toBeGreaterThanOrEqual(MIN_TAP);
  });

  test('cart icon meets 44px minimum tap target', async ({ page }) => {
    await page.goto('/');
    const box = await page.locator('a[href="/cart"]').first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(MIN_TAP);
    expect(box!.height).toBeGreaterThanOrEqual(MIN_TAP);
  });

  test('hero CTA buttons meet 44px height minimum', async ({ page }) => {
    await page.goto('/');
    const box = await page.getByRole('link', { name: 'Shop Collection' }).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(MIN_TAP);
  });

  test('tapping a product card navigates to detail page', async ({ page }) => {
    await page.goto('/products');
    const firstCard = page.locator('a[href^="/products/"]').first();
    await firstCard.tap();
    await expect(page).toHaveURL(/\/products\/.+/);
  });

  test('tapping cart icon navigates to /cart', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/cart"]').first().tap();
    await expect(page).toHaveURL('/cart');
  });

  test('page is vertically scrollable', async ({ page }) => {
    await page.goto('/');
    const before = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy(0, 400));
    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBeGreaterThan(before);
  });
});
