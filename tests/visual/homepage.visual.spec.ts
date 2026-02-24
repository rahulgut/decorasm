import { test, expect } from '@playwright/test';
import { stabilizePage } from './helpers';

test.describe('Homepage Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await stabilizePage(page);
  });

  test('full page screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('hero section', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toHaveScreenshot('homepage-hero.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('navigation bar', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toHaveScreenshot('homepage-navbar.png');
  });

  test('footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot('homepage-footer.png');
  });
});
