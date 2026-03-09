import { test, expect, Page } from '@playwright/test';

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

async function openMobileMenu(page: Page) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('button', { name: /Close/i })).toBeVisible();
}

test.describe('Mobile Navigation', () => {
  test('hamburger visible on mobile, hidden on desktop', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();

    await page.setViewportSize(DESKTOP);
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
  });

  test('drawer opens and shows all nav links', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await openMobileMenu(page);

    for (const label of ['Home', 'Shop', 'Furniture', 'Lighting', 'Accessories']) {
      await expect(page.getByRole('link', { name: label }).last()).toBeVisible();
    }
  });

  test('drawer closes on X button', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await openMobileMenu(page);
    await page.getByRole('button', { name: /Close/i }).click();
    await expect(page.getByRole('button', { name: /Close/i })).toBeHidden();
  });

  test('drawer closes on backdrop click', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await openMobileMenu(page);
    // Click the backdrop overlay (the semi-transparent div with onClick={onClose})
    await page.evaluate(() => {
      const backdrop = document.querySelector('div[aria-hidden="true"]');
      if (backdrop) backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await expect(page.getByRole('button', { name: /Close/i })).toBeHidden({ timeout: 3000 });
  });

  test('drawer closes on Escape key', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await openMobileMenu(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /Close/i })).toBeHidden();
  });

  test('tapping Shop navigates to /products', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await openMobileMenu(page);
    await page.getByRole('link', { name: 'Shop', exact: true }).last().click();
    await expect(page).toHaveURL('/products');
  });

  test('logo and cart icon visible on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Decorasm' })).toBeVisible();
    await expect(page.locator('a[href="/cart"]').first()).toBeVisible();
  });
});
