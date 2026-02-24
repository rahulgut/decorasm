import { test, expect } from '@playwright/test';

const MOBILE = { width: 390, height: 844 };
const NARROW = { width: 375, height: 667 };
const TABLET = { width: 768, height: 1024 };

test.describe('Mobile Layout', () => {
  test('no horizontal overflow on homepage', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    const overflow = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth);
    expect(overflow).toBe(false);
  });

  test('no horizontal overflow on products page', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/products');
    const overflow = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth);
    expect(overflow).toBe(false);
  });

  test('no horizontal overflow on cart page', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/cart');
    const overflow = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth);
    expect(overflow).toBe(false);
  });

  test('hero heading visible on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Transform Your Space with Timeless Design' })
    ).toBeVisible();
  });

  test('hero CTA buttons visible on narrow screen', async ({ page }) => {
    await page.setViewportSize(NARROW);
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Shop Collection' })).toBeVisible();
  });

  test('category pills visible on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/products');
    await expect(page.getByRole('link', { name: 'All', exact: true })).toBeVisible();
  });

  test('viewport meta tag present', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[name="viewport"]', (el) => el.getAttribute('content') ?? '');
    expect(content).toContain('width=device-width');
  });

  test('sticky navbar within viewport width on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    const header = page.locator('header').first();
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(MOBILE.width);
  });
});
