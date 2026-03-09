import { test, expect } from '@playwright/test';

const MOBILE = { width: 390, height: 844 };
const MIN_TAP = 44;

test.describe('Mobile Forms', () => {
  test.use({ hasTouch: true });
  test('checkout page renders without overflow on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/checkout');
    const overflow = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth);
    expect(overflow).toBe(false);
  });

  test('checkout heading visible on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Checkout', exact: true })).toBeVisible();
  });

  test('search input visible and typeable on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/products');
    const searchInput = page.locator('#product-search');
    await expect(searchInput).toBeVisible();
    await searchInput.tap();
    await searchInput.fill('chair');
    await expect(searchInput).toHaveValue('chair');
  });
});
