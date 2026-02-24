import { test, expect } from '@playwright/test';
import { stabilizePage } from './helpers';

test.describe('Checkout Page Visual Regression', () => {
  test('checkout form', async ({ page }) => {
    await page.goto('/checkout');
    await stabilizePage(page);

    await expect(page).toHaveScreenshot('checkout-full.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});
