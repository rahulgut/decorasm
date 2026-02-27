import { test, expect, type Page } from '@playwright/test';

/**
 * Checkout tests — covers:
 *  - Empty cart redirects/shows EmptyState on /checkout
 *  - Checkout page heading and layout
 *  - Order summary sidebar reflects cart contents
 *  - Shipping form renders all required fields
 *  - Form validation: all required fields show error messages when blank
 *  - Email format validation
 *  - Individual error messages clear when the user fills in the field
 *  - Successful order placement end-to-end:
 *      browse → product detail → add to cart → checkout → fill form → place order → confirmation
 *  - Confirmation page: "Thank You!" heading, order number display,
 *    "Continue Shopping" and "Back to Home" links
 *
 * NOTE: The Input component renders <label> without an htmlFor attribute, so
 * Playwright's getByLabel() cannot associate labels with inputs. All field
 * interactions use getByPlaceholder() instead, which is unambiguous.
 */

// ── Helpers ────────────────────────────────────────────────────────────────

/** Navigates to a product page and adds it to the cart. */
async function addProductToCart(page: Page, slug: string, quantity = 1) {
  await page.goto(`/products/${slug}`);
  await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible();

  if (quantity > 1) {
    const addSection = page.locator('div').filter({ hasText: 'Add to Cart' }).last();
    const incrementBtn = addSection.locator('button', { hasText: '+' });
    for (let i = 1; i < quantity; i++) {
      await incrementBtn.click();
    }
  }

  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByRole('button', { name: 'Added!' })).toBeVisible({ timeout: 5000 });
}

/**
 * Fills in all valid shipping form fields using placeholder-based locators.
 * The Input component does not wire <label htmlFor>, so getByPlaceholder is
 * the most reliable selector here.
 */
async function fillShippingForm(page: Page, overrides: Record<string, string> = {}) {
  const defaults = {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '(555) 987-6543',
    address: '42 Elm Street',
    city: 'Portland',
    state: 'OR',
    zipCode: '97201',
    ...overrides,
  };

  await page.getByPlaceholder('John Doe').fill(defaults.fullName);
  await page.getByPlaceholder('john@example.com').fill(defaults.email);
  await page.getByPlaceholder('(555) 123-4567').fill(defaults.phone);
  await page.getByPlaceholder('123 Main St, Apt 4').fill(defaults.address);
  await page.getByPlaceholder('New York').fill(defaults.city);
  await page.getByPlaceholder('NY').fill(defaults.state);
  await page.getByPlaceholder('10001').fill(defaults.zipCode);
}

// Products used in tests
const PRODUCT = { slug: 'linen-cushion-cover-set', name: 'Linen Cushion Cover Set', price: 5900 };
const EXPENSIVE = { slug: 'moroccan-handwoven-rug', name: 'Moroccan Handwoven Rug', price: 79900 };

// ── Test suite ─────────────────────────────────────────────────────────────

test.describe('Checkout page (/checkout)', () => {
  // ── Empty cart state ─────────────────────────────────────────────────────

  test.describe('Empty cart on checkout', () => {
    test('shows "Checkout" heading on empty cart', async ({ page }) => {
      await page.goto('/checkout');
      // exact: true so we don't match "Nothing to checkout"
      await expect(
        page.getByRole('heading', { name: 'Checkout', exact: true })
      ).toBeVisible();
    });

    test('shows EmptyState with "Nothing to checkout" message', async ({ page }) => {
      await page.goto('/checkout');
      await expect(
        page.getByText('Nothing to checkout')
      ).toBeVisible({ timeout: 5000 });
    });

    test('"Browse Products" link from empty checkout navigates to /products', async ({ page }) => {
      await page.goto('/checkout');
      const browseLink = page.getByRole('link', { name: 'Browse Products' });
      await expect(browseLink).toBeVisible({ timeout: 5000 });
      await browseLink.click();
      await expect(page).toHaveURL('/products');
    });
  });

  // ── Checkout page layout ─────────────────────────────────────────────────

  test.describe('Checkout layout with items in cart', () => {
    test.beforeEach(async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await expect(
        page.getByRole('heading', { name: 'Checkout', exact: true })
      ).toBeVisible();
    });

    test('displays the "Checkout" heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Checkout', exact: true })
      ).toBeVisible();
    });

    test('displays the "Shipping Information" form heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Shipping Information' })
      ).toBeVisible();
    });

    test('displays the "Your Order" summary sidebar heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Your Order' })
      ).toBeVisible();
    });

    test('order summary sidebar shows the product added to cart', async ({ page }) => {
      await expect(page.getByText(PRODUCT.name)).toBeVisible();
    });

    test('order summary sidebar shows subtotal and total', async ({ page }) => {
      await expect(page.getByText('Subtotal')).toBeVisible();
      // exact: true prevents matching "Subtotal" in "Total"
      await expect(page.getByText('Total', { exact: true })).toBeVisible();
    });
  });

  // ── Shipping form fields ─────────────────────────────────────────────────

  test.describe('Shipping form fields', () => {
    test.beforeEach(async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
    });

    test('renders Full Name label and placeholder', async ({ page }) => {
      await expect(page.getByText('Full Name')).toBeVisible();
      await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    });

    test('renders Email label and placeholder', async ({ page }) => {
      await expect(page.getByText('Email')).toBeVisible();
      await expect(page.getByPlaceholder('john@example.com')).toBeVisible();
    });

    test('renders Phone label and placeholder', async ({ page }) => {
      await expect(page.getByText('Phone')).toBeVisible();
      await expect(page.getByPlaceholder('(555) 123-4567')).toBeVisible();
    });

    test('renders Street Address label and placeholder', async ({ page }) => {
      await expect(page.getByText('Street Address')).toBeVisible();
      await expect(page.getByPlaceholder('123 Main St, Apt 4')).toBeVisible();
    });

    test('renders City label and placeholder', async ({ page }) => {
      await expect(page.getByText('City')).toBeVisible();
      await expect(page.getByPlaceholder('New York')).toBeVisible();
    });

    test('renders State label and placeholder', async ({ page }) => {
      await expect(page.getByText('State')).toBeVisible();
      await expect(page.getByPlaceholder('NY')).toBeVisible();
    });

    test('renders ZIP Code label and placeholder', async ({ page }) => {
      await expect(page.getByText('ZIP Code')).toBeVisible();
      await expect(page.getByPlaceholder('10001')).toBeVisible();
    });

    test('renders "Place Order" submit button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Place Order' })).toBeVisible();
    });
  });

  // ── Form validation ──────────────────────────────────────────────────────

  test.describe('Form validation', () => {
    test.beforeEach(async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await expect(page.getByRole('button', { name: 'Place Order' })).toBeVisible();
    });

    test('submitting empty form shows all required field errors', async ({ page }) => {
      await page.getByRole('button', { name: 'Place Order' }).click();

      await expect(page.getByText('Name is required')).toBeVisible();
      await expect(page.getByText('Email is required')).toBeVisible();
      await expect(page.getByText('Phone is required')).toBeVisible();
      await expect(page.getByText('Address is required')).toBeVisible();
      await expect(page.getByText('City is required')).toBeVisible();
      await expect(page.getByText('State is required')).toBeVisible();
      await expect(page.getByText('ZIP code is required')).toBeVisible();
    });

    test('shows "Invalid email" error for malformed email', async ({ page }) => {
      await expect(page.getByText('Shipping Information')).toBeVisible({ timeout: 5000 });
      await page.getByPlaceholder('John Doe').fill('Test User');
      await page.getByPlaceholder('john@example.com').fill('not-an-email');
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page.getByText('Invalid email')).toBeVisible({ timeout: 5000 });
    });

    test('valid email clears the email error', async ({ page }) => {
      // Trigger the error first
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page.getByText('Email is required')).toBeVisible();

      // Fill in valid email
      await page.getByPlaceholder('john@example.com').fill('valid@example.com');

      // The error should clear
      await expect(page.getByText('Email is required')).not.toBeVisible();
    });

    test('filling Full Name clears the name error', async ({ page }) => {
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page.getByText('Name is required')).toBeVisible();

      await page.getByPlaceholder('John Doe').fill('Alice');
      await expect(page.getByText('Name is required')).not.toBeVisible();
    });

    test('form does not submit while there are validation errors', async ({ page }) => {
      // Leave all fields blank and click Place Order
      await page.getByRole('button', { name: 'Place Order' }).click();

      // URL must remain /checkout (no redirect to confirmation)
      await expect(page).toHaveURL('/checkout');
    });

    test('partial form submission shows only the missing field errors', async ({ page }) => {
      // Fill in everything except ZIP code
      await page.getByPlaceholder('John Doe').fill('Bob Builder');
      await page.getByPlaceholder('john@example.com').fill('bob@example.com');
      await page.getByPlaceholder('(555) 123-4567').fill('555-0000');
      await page.getByPlaceholder('123 Main St, Apt 4').fill('1 Test Ave');
      await page.getByPlaceholder('New York').fill('Denver');
      await page.getByPlaceholder('NY').fill('CO');
      // Leave ZIP Code blank

      await page.getByRole('button', { name: 'Place Order' }).click();

      // Only the ZIP error should appear
      await expect(page.getByText('ZIP code is required')).toBeVisible();
      await expect(page.getByText('Name is required')).not.toBeVisible();
      await expect(page.getByText('Email is required')).not.toBeVisible();
    });
  });

  // ── "Place Order" loading state ──────────────────────────────────────────

  test.describe('Submit button loading state', () => {
    test('button shows "Placing Order..." while the request is in-flight', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');

      await fillShippingForm(page);

      const pending: { resolve: (() => void) | null } = { resolve: null };
      await page.route('**/api/orders', async (route) => {
        await new Promise<void>((resolve) => { pending.resolve = resolve; });
        await route.continue();
      });

      page.getByRole('button', { name: 'Place Order' }).click();
      await expect(
        page.getByRole('button', { name: 'Placing Order...' })
      ).toBeVisible({ timeout: 3000 });

      pending.resolve?.();
      await page.unrouteAll({ behavior: 'ignoreErrors' });
    });
  });

  // ── End-to-end purchase flow ─────────────────────────────────────────────

  test.describe('Full purchase flow', () => {
    test('completes a purchase and reaches the confirmation page', async ({ page }) => {
      // 1. Browse to a product detail page
      await page.goto('/products/brass-pendant-light');
      await expect(
        page.getByRole('heading', { name: 'Brass Pendant Light' })
      ).toBeVisible();

      // 2. Add the product to the cart
      await page.getByRole('button', { name: 'Add to Cart' }).click();
      await expect(
        page.getByRole('button', { name: 'Added!' })
      ).toBeVisible({ timeout: 5000 });

      // 3. Navigate to the cart and proceed to checkout
      await page.goto('/cart');
      await expect(page.getByText('Brass Pendant Light')).toBeVisible({ timeout: 5000 });
      await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
      await expect(page).toHaveURL('/checkout');

      // 4. Fill out the shipping form
      await fillShippingForm(page);

      // 5. Place the order
      await page.getByRole('button', { name: 'Place Order' }).click();

      // 6. Should land on /checkout/confirmation?order=...
      await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/, { timeout: 15000 });
    });

    test('confirmation page shows "Thank You!" heading', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/, { timeout: 15000 });

      await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible();
    });

    test('confirmation page shows a success message', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/, { timeout: 15000 });

      await expect(
        page.getByText('Your order has been placed successfully')
      ).toBeVisible();
    });

    test('confirmation page displays the order number from the URL', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/, { timeout: 15000 });

      // Extract the order number from the URL query string
      const url = page.url();
      const orderNumber = new URL(url).searchParams.get('order');
      expect(orderNumber).toBeTruthy();

      // The order number should be rendered on screen
      await expect(page.getByText(orderNumber!)).toBeVisible();
      // "Order Number" label should also be present
      await expect(page.getByText('Order Number')).toBeVisible();
    });

    test('confirmation page has "Continue Shopping" link to /products', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/, { timeout: 15000 });

      const continueBtn = page.getByRole('link', { name: 'Continue Shopping' });
      await expect(continueBtn).toBeVisible();
      await expect(continueBtn).toHaveAttribute('href', '/products');
    });

    test('confirmation page has "Back to Home" link to /', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/, { timeout: 15000 });

      const homeBtn = page.getByRole('link', { name: 'Back to Home' });
      await expect(homeBtn).toBeVisible();
      await expect(homeBtn).toHaveAttribute('href', '/');
    });

    test('"Continue Shopping" navigates to /products', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/, { timeout: 15000 });

      await page.getByRole('link', { name: 'Continue Shopping' }).click();
      await expect(page).toHaveURL('/products');
    });

    test('"Back to Home" navigates to /', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/, { timeout: 15000 });

      await page.getByRole('link', { name: 'Back to Home' }).click();
      await expect(page).toHaveURL('/');
    });

    test('cart is cleared after a successful order', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/, { timeout: 15000 });

      // After order, the cart badge should be gone
      const badge = page.locator('a[href="/cart"] span');
      await expect(badge).not.toBeVisible();
    });

    test('full flow with expensive product uses free shipping', async ({ page }) => {
      // Moroccan Handwoven Rug ($799) qualifies for free shipping
      await addProductToCart(page, EXPENSIVE.slug);
      await page.goto('/cart');
      const shippingRow = page.locator('div.flex.justify-between').filter({ hasText: 'Shipping' });
      await expect(shippingRow).toContainText('Free');

      await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
      await expect(page).toHaveURL('/checkout');

      // Order summary sidebar should also show Free shipping
      const summaryShipping = page
        .locator('div.flex.justify-between')
        .filter({ hasText: 'Shipping' });
      await expect(summaryShipping).toContainText('Free');

      await fillShippingForm(page);
      await page.getByRole('button', { name: 'Place Order' }).click();
      await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/, { timeout: 15000 });
      await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible();
    });
  });

  // ── Direct confirmation page access ─────────────────────────────────────

  test.describe('Confirmation page standalone', () => {
    test('visiting confirmation page without order param renders without order number block', async ({ page }) => {
      await page.goto('/checkout/confirmation');
      await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible();
      // The order number container only renders when the "order" param is present
      await expect(page.getByText('Order Number')).not.toBeVisible();
    });

    test('visiting confirmation page with a provided order param shows the order number', async ({ page }) => {
      await page.goto('/checkout/confirmation?order=TEST-12345');
      await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible();
      await expect(page.getByText('Order Number')).toBeVisible();
      await expect(page.getByText('TEST-12345')).toBeVisible();
    });
  });
});
