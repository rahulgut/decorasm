import { test, expect } from '@playwright/test';
import { stabilizePage } from './helpers';

test.describe('Cart Page Visual Regression', () => {
  test('empty cart', async ({ page }) => {
    await page.goto('/cart');
    await stabilizePage(page);

    await expect(page).toHaveScreenshot('cart-empty.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});
