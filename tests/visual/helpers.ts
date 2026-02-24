import { Page } from '@playwright/test';

/**
 * Wait for the page to stabilize — images loaded, animations settled, fonts rendered.
 */
export async function stabilizePage(page: Page) {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Wait for all images to load
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise((resolve) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
        }))
    )
  );

  // Wait for fonts
  await page.evaluate(() => document.fonts.ready);

  // Small delay for any CSS transitions
  await page.waitForTimeout(500);
}

/**
 * Mask dynamic content (prices, dates, order numbers) to avoid false positives.
 */
export function dynamicContentMasks(page: Page) {
  return [
    page.locator('[data-testid="price"]'),
    page.locator('[data-testid="order-number"]'),
    page.locator('[data-testid="timestamp"]'),
    page.locator('time'),
  ];
}
