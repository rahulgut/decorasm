import { test, expect, devices } from '@playwright/test';
import { stabilizePage } from './helpers';

test.describe('Navigation Visual Regression', () => {
  test('desktop navbar', async ({ page }) => {
    await page.goto('/');
    await stabilizePage(page);

    const nav = page.locator('nav');
    await expect(nav).toHaveScreenshot('nav-desktop.png');
  });

  test('desktop footer', async ({ page }) => {
    await page.goto('/');
    await stabilizePage(page);

    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot('nav-footer.png');
  });
});

test.describe('Mobile Navigation Visual Regression', () => {
  test.use({ ...devices['iPhone 13'] });

  test('mobile navbar', async ({ page }) => {
    await page.goto('/');
    await stabilizePage(page);

    const nav = page.locator('nav');
    await expect(nav).toHaveScreenshot('nav-mobile.png');
  });

  test('mobile menu open', async ({ page }) => {
    await page.goto('/');
    await stabilizePage(page);

    // Click hamburger menu button
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], nav button').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);

      await expect(page).toHaveScreenshot('nav-mobile-menu-open.png', {
        fullPage: true,
      });
    }
  });
});
