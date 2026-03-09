import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Product Catalog (/products) tests — covers:
 *  - Page heading and initial product grid
 *  - Category filter pills (All, Furniture, Lighting, Wall Art, Textiles, Accessories)
 *  - Active pill highlighting
 *  - Search bar filtering by product name
 *  - Combining search + category filters
 *  - Product card contents (name, price, category label)
 *  - Clicking a product card navigates to the detail page
 */

test.describe('Product Catalog (/products)', () => {
  test.beforeAll(async ({ request }: { request: APIRequestContext }) => {
    await request.post('/api/seed');
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    // Wait for the product grid to be populated before each test
    await expect(page.getByRole('heading', { name: 'Our Collection' })).toBeVisible();
  });

  // ── Page rendering ─────────────────────────────────────────────────────────

  test.describe('Page rendering', () => {
    test('displays the "Our Collection" heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Our Collection' })
      ).toBeVisible();
    });

    test('displays the catalog sub-text', async ({ page }) => {
      await expect(
        page.getByText('Discover pieces that transform your space')
      ).toBeVisible();
    });

    test('renders all 17 seeded products by default', async ({ page }) => {
      // Every product card is an anchor pointing to /products/<slug>
      const cards = page.locator('a[href^="/products/"]');
      await expect(cards).toHaveCount(17);
    });

    test('renders search input field', async ({ page }) => {
      await expect(
        page.locator('#product-search')
      ).toBeVisible();
    });
  });

  // ── Category pills ─────────────────────────────────────────────────────────

  test.describe('Category filter pills', () => {
    // Category pills are rounded-full links inside #main-content
    // Use exact text matching and scope to main to avoid navbar duplicates
    const pill = (page: import('@playwright/test').Page, name: string) =>
      page.locator('#main-content a.rounded-full').filter({ hasText: new RegExp(`^${name}$`) });

    test('renders all six category pills', async ({ page }) => {
      const expectedPills = ['All', 'Furniture', 'Lighting', 'Wall Art', 'Textiles', 'Accessories'];
      for (const label of expectedPills) {
        await expect(pill(page, label)).toBeVisible();
      }
    });

    test('"All" pill is active by default (no category param)', async ({ page }) => {
      const allPill = pill(page, 'All');
      await expect(allPill).toHaveAttribute('href', '/products');
      await expect(allPill).toHaveClass(/text-white/);
    });

    test('clicking "Furniture" navigates to /products?category=furniture', async ({ page }) => {
      await pill(page, 'Furniture').click();
      await expect(page).toHaveURL('/products?category=furniture');
    });

    test('clicking "Lighting" navigates to /products?category=lighting', async ({ page }) => {
      await pill(page, 'Lighting').click();
      await expect(page).toHaveURL('/products?category=lighting');
    });

    test('clicking "Wall Art" navigates to /products?category=wall-art', async ({ page }) => {
      await pill(page, 'Wall Art').click();
      await expect(page).toHaveURL('/products?category=wall-art');
    });

    test('clicking "Textiles" navigates to /products?category=textiles', async ({ page }) => {
      await pill(page, 'Textiles').click();
      await expect(page).toHaveURL('/products?category=textiles');
    });

    test('clicking "Accessories" navigates to /products?category=accessories', async ({ page }) => {
      await pill(page, 'Accessories').click();
      await expect(page).toHaveURL('/products?category=accessories');
    });

    test('Furniture filter shows only furniture products', async ({ page }) => {
      await page.goto('/products?category=furniture');
      await expect(page.getByRole('heading', { name: 'Our Collection' })).toBeVisible();

      // Seed data has 3 furniture items
      const cards = page.locator('a[href^="/products/"]');
      await expect(cards).toHaveCount(3);

      // Each card should show "Furniture" category label
      const categoryLabels = page.getByText('Furniture');
      // At minimum the active pill and all card labels must be present
      await expect(categoryLabels.first()).toBeVisible();
    });

    test('Lighting filter shows only lighting products', async ({ page }) => {
      await page.goto('/products?category=lighting');
      await expect(page.getByRole('heading', { name: 'Our Collection' })).toBeVisible();

      // Seed data has 3 lighting items
      const cards = page.locator('a[href^="/products/"]');
      await expect(cards).toHaveCount(3);
    });

    test('Wall Art filter shows only wall-art products', async ({ page }) => {
      await page.goto('/products?category=wall-art');
      const cards = page.locator('a[href^="/products/"]');
      await expect(cards).toHaveCount(3);
    });

    test('Textiles filter shows only textiles products', async ({ page }) => {
      await page.goto('/products?category=textiles');
      const cards = page.locator('a[href^="/products/"]');
      await expect(cards).toHaveCount(3);
    });

    test('Accessories filter shows only accessories products', async ({ page }) => {
      await page.goto('/products?category=accessories');
      const cards = page.locator('a[href^="/products/"]');
      await expect(cards).toHaveCount(5);
    });

    test('active pill is highlighted when a category is selected', async ({ page }) => {
      await page.goto('/products?category=lighting');
      await expect(pill(page, 'Lighting')).toHaveClass(/text-white/);
      await expect(pill(page, 'All')).not.toHaveClass(/bg-brand-500/);
    });

    test('"All" pill navigates back to unfiltered catalog', async ({ page }) => {
      await page.goto('/products?category=furniture');
      await pill(page, 'All').click();
      await expect(page).toHaveURL('/products');
      const cards = page.locator('a[href^="/products/"]');
      await expect(cards).toHaveCount(17);
    });
  });

  // ── Search bar ─────────────────────────────────────────────────────────────

  test.describe('Search functionality', () => {
    test('search input is visible and accepts text', async ({ page }) => {
      const searchInput = page.locator('#product-search');
      await searchInput.fill('lamp');
      await expect(searchInput).toHaveValue('lamp');
    });

    test('submitting a search filters products by name', async ({ page }) => {
      const searchInput = page.locator('#product-search');
      await searchInput.fill('lamp');
      await searchInput.press('Enter');

      // URL should include search param
      await expect(page).toHaveURL(/search=lamp/);

      // "Ceramic Table Lamp" and "Modern Arc Floor Lamp" match "lamp"
      await expect(page.getByText('Ceramic Table Lamp')).toBeVisible();
      await expect(page.getByText('Modern Arc Floor Lamp')).toBeVisible();

      // Non-matching products should not appear
      await expect(page.getByText('Mid-Century Lounge Chair')).not.toBeVisible();
    });

    test('search is case-insensitive', async ({ page }) => {
      const searchInput = page.locator('#product-search');
      await searchInput.fill('CHAIR');
      await searchInput.press('Enter');

      await expect(page).toHaveURL(/search=CHAIR/);
      await expect(page.getByText('Mid-Century Lounge Chair')).toBeVisible();
      await expect(page.getByText('Woven Rattan Accent Chair')).toBeVisible();
    });

    test('searching for a non-existent product shows no product cards', async ({ page }) => {
      await page.goto('/products?search=doesnotexistxyz');
      const cards = page.locator('a[href^="/products/"]');
      await expect(cards).toHaveCount(0);
    });

    test('search pre-populates input when search param is in URL', async ({ page }) => {
      await page.goto('/products?search=vase');
      const searchInput = page.locator('#product-search');
      await expect(searchInput).toHaveValue('vase');
    });

    test('search and category params can be combined', async ({ page }) => {
      // There is only one accessories item with "candle" in the name
      await page.goto('/products?category=accessories&search=candle');
      await expect(page.getByText('Scented Soy Candle Trio')).toBeVisible();
      const cards = page.locator('a[href^="/products/"]');
      await expect(cards).toHaveCount(1);
    });
  });

  // ── Product cards ──────────────────────────────────────────────────────────

  test.describe('Product cards', () => {
    test('product card displays name, price and category label', async ({ page }) => {
      await expect(page.getByText('Mid-Century Lounge Chair')).toBeVisible();
      await expect(page.getByText('$899.00')).toBeVisible();
      // Category label is rendered as uppercase text inside the card
      const furnitureLabels = page.locator('p', { hasText: 'FURNITURE' });
      await expect(furnitureLabels.first()).toBeVisible();
    });

    test('featured product card shows "Featured" badge', async ({ page }) => {
      // Mid-Century Lounge Chair is featured
      const featuredBadges = page.getByText('Featured');
      await expect(featuredBadges.first()).toBeVisible();
    });

    test('clicking a product card navigates to the detail page', async ({ page }) => {
      await page.getByText('Mid-Century Lounge Chair').click();
      await expect(page).toHaveURL('/products/mid-century-lounge-chair');
      await expect(
        page.getByRole('heading', { name: 'Mid-Century Lounge Chair' })
      ).toBeVisible();
    });

    test('product cards link directly to /products/<slug>', async ({ page }) => {
      const chairCard = page.locator('a[href="/products/mid-century-lounge-chair"]');
      await expect(chairCard).toBeVisible();
    });
  });
});
