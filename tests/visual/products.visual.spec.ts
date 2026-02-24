import { test, expect } from '@playwright/test';
import { stabilizePage } from './helpers';

test.describe('Products Page Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await stabilizePage(page);
  });

  test('full catalog page', async ({ page }) => {
    await expect(page).toHaveScreenshot('products-full.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('category filter pills', async ({ page }) => {
    const pills = page.locator('[class*="category"], [class*="pill"], [class*="filter"]').first();
    if (await pills.isVisible()) {
      await expect(pills).toHaveScreenshot('products-category-pills.png');
    }
  });

  test('product grid layout', async ({ page }) => {
    const grid = page.locator('[class*="grid"]').first();
    await expect(grid).toHaveScreenshot('products-grid.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
