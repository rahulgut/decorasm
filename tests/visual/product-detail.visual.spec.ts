import { test, expect } from '@playwright/test';
import { stabilizePage } from './helpers';

test.describe('Product Detail Visual Regression', () => {
  test('product detail page', async ({ page }) => {
    // Navigate to products and click the first one
    await page.goto('/products');
    await stabilizePage(page);

    const firstProduct = page.locator('a[href*="/products/"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await stabilizePage(page);

      await expect(page).toHaveScreenshot('product-detail-full.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    }
  });
});
