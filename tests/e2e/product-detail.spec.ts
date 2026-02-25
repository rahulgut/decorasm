import { test, expect } from '@playwright/test';

/**
 * Product Detail Page (/products/[slug]) tests — covers:
 *  - Breadcrumb navigation
 *  - Product image, name, price, description
 *  - Dimensions, material, availability metadata
 *  - Category and "Featured" badges
 *  - Quantity stepper on detail page (pre-add)
 *  - "Add to Cart" button states: default, "Adding...", "Added!"
 *  - Cart icon badge count updates after adding to cart
 *  - Shipping / return policy info block
 *  - 404 for non-existent slug
 */

// Canonical test product — present in the seeded database
const PRODUCT = {
  slug: 'mid-century-lounge-chair',
  name: 'Mid-Century Lounge Chair',
  price: '$899.00',
  category: 'Furniture',
  url: '/products/mid-century-lounge-chair',
};

const LIGHTING_PRODUCT = {
  slug: 'brass-pendant-light',
  name: 'Brass Pendant Light',
  price: '$229.00',
  url: '/products/brass-pendant-light',
};

test.describe('Product Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRODUCT.url);
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible();
  });

  // ── Breadcrumb ─────────────────────────────────────────────────────────────

  test.describe('Breadcrumb', () => {
    test('renders breadcrumb with Home, Products, category, and product name', async ({ page }) => {
      const main = page.getByRole('main');
      const breadcrumb = main.locator('nav').first();
      await expect(breadcrumb).toBeVisible();
      await expect(breadcrumb.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(breadcrumb.getByRole('link', { name: 'Products' })).toBeVisible();
      await expect(breadcrumb.getByRole('link', { name: PRODUCT.category })).toBeVisible();
      await expect(breadcrumb.getByText(PRODUCT.name)).toBeVisible();
    });

    test('Home breadcrumb link navigates to /', async ({ page }) => {
      const breadcrumb = page.getByRole('main').locator('nav').first();
      await breadcrumb.getByRole('link', { name: 'Home' }).click();
      await expect(page).toHaveURL('/');
    });

    test('Products breadcrumb link navigates to /products', async ({ page }) => {
      const breadcrumb = page.getByRole('main').locator('nav').first();
      await breadcrumb.getByRole('link', { name: 'Products' }).click();
      await expect(page).toHaveURL('/products');
    });

    test('category breadcrumb link navigates to filtered catalog', async ({ page }) => {
      const breadcrumb = page.getByRole('main').locator('nav').first();
      await breadcrumb.getByRole('link', { name: PRODUCT.category }).click();
      await expect(page).toHaveURL('/products?category=furniture');
    });
  });

  // ── Product information ────────────────────────────────────────────────────

  test.describe('Product information', () => {
    test('displays the product heading (h1)', async ({ page }) => {
      await expect(
        page.getByRole('heading', { level: 1, name: PRODUCT.name })
      ).toBeVisible();
    });

    test('displays the formatted price', async ({ page }) => {
      await expect(page.getByText(PRODUCT.price)).toBeVisible();
    });

    test('displays the product description', async ({ page }) => {
      await expect(
        page.getByText('A beautifully crafted mid-century modern lounge chair')
      ).toBeVisible();
    });

    test('displays dimensions metadata', async ({ page }) => {
      await expect(page.getByText('Dimensions')).toBeVisible();
      await expect(page.getByText('32"W x 34"D x 33"H')).toBeVisible();
    });

    test('displays material metadata', async ({ page }) => {
      await expect(page.getByText('Material')).toBeVisible();
      await expect(page.getByText('Walnut wood, cotton blend fabric')).toBeVisible();
    });

    test('displays availability as "In Stock"', async ({ page }) => {
      await expect(page.getByText('Availability')).toBeVisible();
      await expect(page.getByText('In Stock')).toBeVisible();
    });

    test('displays the category badge', async ({ page }) => {
      // Badge with the capitalized category name
      await expect(page.getByText(PRODUCT.category).first()).toBeVisible();
    });

    test('displays "Featured" badge for featured products', async ({ page }) => {
      await expect(page.getByText('Featured')).toBeVisible();
    });

    test('displays free shipping info', async ({ page }) => {
      await expect(
        page.getByRole('main').getByText('Free shipping on orders over $100')
      ).toBeVisible();
    });

    test('displays 30-day return policy info', async ({ page }) => {
      await expect(page.getByRole('main').getByText('30-day return policy')).toBeVisible();
    });
  });

  // ── Quantity stepper on detail page ───────────────────────────────────────

  test.describe('Quantity stepper (pre-add)', () => {
    test('quantity starts at 1', async ({ page }) => {
      // The AddToCartButton renders a quantity span with the current count
      // It is located next to the "-" and "+" buttons
      const quantityDisplay = page.locator('span').filter({ hasText: /^1$/ }).first();
      await expect(quantityDisplay).toBeVisible();
    });

    test('clicking "+" increments quantity', async ({ page }) => {
      // The AddToCartButton's stepper has two buttons: "-" and "+"
      // We target the "+" button that is NOT inside the nav/breadcrumb area
      const addSection = page.locator('div').filter({ hasText: 'Add to Cart' }).last();
      const incrementBtn = addSection.locator('button', { hasText: '+' });
      await incrementBtn.click();

      const quantityDisplay = addSection.locator('span').filter({ hasText: /^2$/ });
      await expect(quantityDisplay).toBeVisible();
    });

    test('clicking "-" decrements quantity (minimum 1)', async ({ page }) => {
      const addSection = page.locator('div').filter({ hasText: 'Add to Cart' }).last();
      const incrementBtn = addSection.locator('button', { hasText: '+' });
      const decrementBtn = addSection.locator('button', { hasText: '-' });

      // Increase to 3 then decrease
      await incrementBtn.click();
      await incrementBtn.click();
      await decrementBtn.click();

      const quantityDisplay = addSection.locator('span').filter({ hasText: /^2$/ });
      await expect(quantityDisplay).toBeVisible();
    });

    test('quantity cannot go below 1', async ({ page }) => {
      const addSection = page.locator('div').filter({ hasText: 'Add to Cart' }).last();
      const decrementBtn = addSection.locator('button', { hasText: '-' });

      // Attempt to decrease below 1
      await decrementBtn.click();

      // Should still display 1
      const quantityDisplay = addSection.locator('span').filter({ hasText: /^1$/ }).first();
      await expect(quantityDisplay).toBeVisible();
    });
  });

  // ── Add to Cart button ─────────────────────────────────────────────────────

  test.describe('Add to Cart button', () => {
    test('renders "Add to Cart" button in default state', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: 'Add to Cart' })
      ).toBeVisible();
    });

    test('button shows "Adding..." while the request is in-flight', async ({ page }) => {
      const addButton = page.getByRole('button', { name: 'Add to Cart' });

      // Intercept the POST /api/cart request and delay it
      const pending: { resolve: (() => void) | null } = { resolve: null };
      await page.route('**/api/cart', async (route) => {
        if (route.request().method() === 'POST') {
          await new Promise<void>((resolve) => { pending.resolve = resolve; });
          await route.continue();
        } else {
          await route.continue();
        }
      });

      // Click without awaiting full resolution
      addButton.click();

      // Should show "Adding..."
      await expect(
        page.getByRole('button', { name: 'Adding...' })
      ).toBeVisible({ timeout: 2000 });

      // Release the route
      pending.resolve?.();

      // Clean up
      await page.unrouteAll({ behavior: 'ignoreErrors' });
    });

    test('button shows "Added!" after a successful add', async ({ page }) => {
      const addButton = page.getByRole('button', { name: 'Add to Cart' });
      await addButton.click();

      // After the API call resolves, text changes to "Added!"
      await expect(
        page.getByRole('button', { name: 'Added!' })
      ).toBeVisible({ timeout: 5000 });
    });

    test('button reverts to "Add to Cart" after the 2-second flash', async ({ page }) => {
      const addButton = page.getByRole('button', { name: 'Add to Cart' });
      await addButton.click();
      await expect(page.getByRole('button', { name: 'Added!' })).toBeVisible({ timeout: 5000 });

      // After 2 seconds the flash clears
      await expect(
        page.getByRole('button', { name: 'Add to Cart' })
      ).toBeVisible({ timeout: 5000 });
    });

    test('cart icon badge count increments after adding item', async ({ page }) => {
      // Before adding — no badge should be visible
      const badge = page.locator('a[href="/cart"] span');
      await expect(badge).not.toBeVisible();

      await page.getByRole('button', { name: 'Add to Cart' }).click();
      await expect(page.getByRole('button', { name: 'Added!' })).toBeVisible({ timeout: 5000 });

      // The badge should now show "1"
      await expect(badge).toBeVisible();
      await expect(badge).toHaveText('1');
    });

    test('adding 2 quantity from the stepper reflects in cart badge', async ({ page }) => {
      const addSection = page.locator('div').filter({ hasText: 'Add to Cart' }).last();
      const incrementBtn = addSection.locator('button', { hasText: '+' });
      await incrementBtn.click(); // quantity = 2

      await page.getByRole('button', { name: 'Add to Cart' }).click();
      await expect(page.getByRole('button', { name: 'Added!' })).toBeVisible({ timeout: 5000 });

      const badge = page.locator('a[href="/cart"] span');
      await expect(badge).toHaveText('2');
    });
  });

  // ── Product image ──────────────────────────────────────────────────────────

  test.describe('Product image', () => {
    test('main product image is visible', async ({ page }) => {
      const img = page.getByRole('img', { name: PRODUCT.name }).first();
      await expect(img).toBeVisible();
    });
  });

  // ── Non-existent product ───────────────────────────────────────────────────

  test.describe('404 for unknown slug', () => {
    test('navigating to a non-existent slug shows a not-found page', async ({ page }) => {
      const response = await page.goto('/products/this-product-does-not-exist');
      expect(response?.status()).toBe(404);
    });
  });

  // ── Second product for cross-checking ─────────────────────────────────────

  test.describe('Brass Pendant Light detail page', () => {
    test('renders correct name and price for a lighting product', async ({ page }) => {
      await page.goto(LIGHTING_PRODUCT.url);
      await expect(
        page.getByRole('heading', { name: LIGHTING_PRODUCT.name })
      ).toBeVisible();
      await expect(page.getByText(LIGHTING_PRODUCT.price)).toBeVisible();
    });

    test('lighting category breadcrumb links to /products?category=lighting', async ({ page }) => {
      await page.goto(LIGHTING_PRODUCT.url);
      const breadcrumb = page.getByRole('main').locator('nav').first();
      const lightingLink = breadcrumb.getByRole('link', { name: 'Lighting' });
      await expect(lightingLink).toHaveAttribute('href', '/products?category=lighting');
    });
  });
});
