import { test, expect } from '@playwright/test';

/**
 * Homepage tests — covers:
 *  - Page metadata and initial render
 *  - Hero section content and CTA buttons
 *  - "Shop by Category" section with 5 category links
 *  - Featured products grid
 *  - Free-shipping CTA banner
 *  - Navbar links
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ── Navbar ────────────────────────────────────────────────────────────────

  test.describe('Navbar', () => {
    test('displays the Decorasm logo linking to home', async ({ page }) => {
      const logo = page.getByRole('link', { name: 'Decorasm' });
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('href', '/');
    });

    test('has desktop navigation links', async ({ page }) => {
      // All nav links are present; they may be hidden on narrow viewports but
      // the desktop layout is used by default in the Playwright device configs.
      await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();
      // exact: true prevents matching "Shop Collection" / "Start Shopping"
      await expect(page.getByRole('link', { name: 'Shop', exact: true })).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Furniture' }).first()
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Lighting' }).first()
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Accessories' }).first()
      ).toBeVisible();
    });

    test('cart icon links to /cart', async ({ page }) => {
      // The cart icon is an anchor wrapping an SVG — find it by its href
      const cartLink = page.locator('a[href="/cart"]').first();
      await expect(cartLink).toBeVisible();
    });

    test('navigates to /products when "Shop" is clicked', async ({ page }) => {
      await page.getByRole('link', { name: 'Shop', exact: true }).click();
      await expect(page).toHaveURL('/products');
    });

    test('navigates to /products?category=furniture when "Furniture" nav link is clicked', async ({ page }) => {
      await page.getByRole('link', { name: 'Furniture' }).first().click();
      await expect(page).toHaveURL('/products?category=furniture');
    });
  });

  // ── Hero section ──────────────────────────────────────────────────────────

  test.describe('Hero section', () => {
    test('renders the hero heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Transform Your Space with Timeless Design' })
      ).toBeVisible();
    });

    test('renders the hero sub-text', async ({ page }) => {
      await expect(
        page.getByText('Curated home decor that blends warmth, elegance, and craftsmanship')
      ).toBeVisible();
    });

    test('"Shop Collection" button links to /products', async ({ page }) => {
      const btn = page.getByRole('link', { name: 'Shop Collection' });
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute('href', '/products');
    });

    test('"Explore Furniture" button links to /products?category=furniture', async ({ page }) => {
      const btn = page.getByRole('link', { name: 'Explore Furniture' });
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute('href', '/products?category=furniture');
    });

    test('"Shop Collection" navigates to catalog', async ({ page }) => {
      await page.getByRole('link', { name: 'Shop Collection' }).click();
      await expect(page).toHaveURL('/products');
      await expect(page.getByRole('heading', { name: 'Our Collection' })).toBeVisible();
    });
  });

  // ── Shop by Category section ───────────────────────────────────────────────

  test.describe('Shop by Category', () => {
    test('renders the section heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Shop by Category' })
      ).toBeVisible();
    });

    test('displays all 5 category cards', async ({ page }) => {
      // Each category card renders as a link with the category name visible
      const expectedCategories = ['Furniture', 'Lighting', 'Wall Art', 'Textiles', 'Accessories'];
      for (const name of expectedCategories) {
        await expect(page.getByText(name).first()).toBeVisible();
      }
    });

    test('each category card links to the correct filtered URL', async ({ page }) => {
      const expectedLinks = [
        { name: 'furniture', expectedHref: '/products?category=furniture' },
        { name: 'lighting', expectedHref: '/products?category=lighting' },
        { name: 'wall-art', expectedHref: '/products?category=wall-art' },
        { name: 'textiles', expectedHref: '/products?category=textiles' },
        { name: 'accessories', expectedHref: '/products?category=accessories' },
      ];

      for (const { name, expectedHref } of expectedLinks) {
        const link = page.locator(`a[href="${expectedHref}"]`).first();
        await expect(link).toBeVisible();
      }
    });

    test('clicking the Lighting category navigates to filtered catalog', async ({ page }) => {
      const lightingLink = page.locator('a[href="/products?category=lighting"]').first();
      await lightingLink.click();
      await expect(page).toHaveURL('/products?category=lighting');
    });

    test('clicking the Textiles category navigates to filtered catalog', async ({ page }) => {
      const textilesLink = page.locator('a[href="/products?category=textiles"]').first();
      await textilesLink.click();
      await expect(page).toHaveURL('/products?category=textiles');
    });
  });

  // ── Featured Products section ──────────────────────────────────────────────

  test.describe('Featured Products', () => {
    test('renders "Featured Pieces" heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Featured Pieces' })
      ).toBeVisible();
    });

    test('renders "View all" link pointing to /products', async ({ page }) => {
      const viewAll = page.getByRole('link', { name: /view all/i });
      await expect(viewAll).toBeVisible();
      await expect(viewAll).toHaveAttribute('href', '/products');
    });

    test('displays at least one featured product card', async ({ page }) => {
      // Product cards are links that point to /products/<slug>
      const productLinks = page.locator('a[href^="/products/"]');
      await expect(productLinks.first()).toBeVisible();
      // The seeded data has 8 featured products on the homepage
      const count = await productLinks.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('featured product card shows name and price', async ({ page }) => {
      // Mid-Century Lounge Chair and Brass Pendant Light are both featured
      await expect(page.getByText('Mid-Century Lounge Chair')).toBeVisible();
      await expect(page.getByText('$899.00')).toBeVisible();
    });

    test('"View all" navigates to /products', async ({ page }) => {
      await page.getByRole('link', { name: /view all/i }).click();
      await expect(page).toHaveURL('/products');
    });
  });

  // ── CTA Banner section ─────────────────────────────────────────────────────

  test.describe('CTA Banner', () => {
    test('renders the free shipping banner heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Free Shipping on Orders Over $100' })
      ).toBeVisible();
    });

    test('renders the banner description', async ({ page }) => {
      await expect(
        page.getByText('Elevate your home without worrying about delivery costs')
      ).toBeVisible();
    });

    test('"Start Shopping" button is present and links to /products', async ({ page }) => {
      const btn = page.getByRole('link', { name: 'Start Shopping' });
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute('href', '/products');
    });

    test('"Start Shopping" navigates to the catalog', async ({ page }) => {
      await page.getByRole('link', { name: 'Start Shopping' }).click();
      await expect(page).toHaveURL('/products');
    });
  });

  // ── Page metadata ──────────────────────────────────────────────────────────

  test('page title contains "Decorasm"', async ({ page }) => {
    await expect(page).toHaveTitle(/Decorasm/);
  });
});
