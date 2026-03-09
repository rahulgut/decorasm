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
  await expect(page.getByRole('button', { name: 'Added to cart' })).toBeVisible({ timeout: 5000 });
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

    test('renders "Proceed to Payment" submit button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeVisible();
    });
  });

  // ── Form validation ──────────────────────────────────────────────────────

  test.describe('Form validation', () => {
    test.beforeEach(async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeVisible();
    });

    test('submitting empty form shows all required field errors', async ({ page }) => {
      await page.getByRole('button', { name: 'Proceed to Payment' }).click();

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
      await page.getByRole('button', { name: 'Proceed to Payment' }).click();
      await expect(page.getByText('Invalid email')).toBeVisible({ timeout: 5000 });
    });

    test('valid email clears the email error', async ({ page }) => {
      // Trigger the error first
      await page.getByRole('button', { name: 'Proceed to Payment' }).click();
      await expect(page.getByText('Email is required')).toBeVisible();

      // Fill in valid email
      await page.getByPlaceholder('john@example.com').fill('valid@example.com');

      // The error should clear
      await expect(page.getByText('Email is required')).not.toBeVisible();
    });

    test('filling Full Name clears the name error', async ({ page }) => {
      await page.getByRole('button', { name: 'Proceed to Payment' }).click();
      await expect(page.getByText('Name is required')).toBeVisible();

      await page.getByPlaceholder('John Doe').fill('Alice');
      await expect(page.getByText('Name is required')).not.toBeVisible();
    });

    test('form does not submit while there are validation errors', async ({ page }) => {
      // Leave all fields blank and click Proceed to Payment
      await page.getByRole('button', { name: 'Proceed to Payment' }).click();

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

      await page.getByRole('button', { name: 'Proceed to Payment' }).click();

      // Only the ZIP error should appear
      await expect(page.getByText('ZIP code is required')).toBeVisible();
      await expect(page.getByText('Name is required')).not.toBeVisible();
      await expect(page.getByText('Email is required')).not.toBeVisible();
    });
  });

  // ── "Proceed to Payment" loading state ──────────────────────────────────────────

  test.describe('Submit button loading state', () => {
    test('button shows "Redirecting to Payment..." while the request is in-flight', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');

      await fillShippingForm(page);

      const pending: { resolve: (() => void) | null } = { resolve: null };
      await page.route('**/api/orders', async (route) => {
        await new Promise<void>((resolve) => { pending.resolve = resolve; });
        await route.continue();
      });

      page.getByRole('button', { name: 'Proceed to Payment' }).click();
      await expect(
        page.getByRole('button', { name: 'Redirecting to Payment...' })
      ).toBeVisible({ timeout: 3000 });

      pending.resolve?.();
      await page.unrouteAll({ behavior: 'ignoreErrors' });
    });
  });

  // ── End-to-end purchase flow (with Stripe redirect) ─────────────────────
  // NOTE: Since checkout now redirects to Stripe, these tests intercept the
  // /api/orders response to capture the order number, then navigate directly
  // to the confirmation page.

  test.describe('Full purchase flow', () => {
    /**
     * Helper: submits checkout form and intercepts the Stripe redirect.
     * Returns the order number from the API response.
     */
    async function submitCheckoutAndIntercept(page: Page): Promise<string> {
      // Capture the /api/orders response body via route fulfillment
      // (using waitForResponse + response.json() fails because the page navigates
      // to Stripe and the response body gets garbage-collected)
      let capturedData: { url: string; orderNumber: string } | null = null;
      await page.route('**/api/orders', async (route) => {
        const response = await route.fetch();
        const body = await response.json();
        capturedData = body;
        await route.fulfill({ response, body: JSON.stringify(body) });
      });
      // Block navigation to Stripe so the test can continue
      await page.route('https://checkout.stripe.com/**', (route) => route.abort());

      await page.getByRole('button', { name: 'Proceed to Payment' }).click();
      // Wait for the API call to complete
      await page.waitForResponse('**/api/orders');

      expect(capturedData).not.toBeNull();
      expect(capturedData!.url).toContain('checkout.stripe.com');
      expect(capturedData!.orderNumber).toMatch(/^DEC-/);
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      return capturedData!.orderNumber;
    }

    test('checkout API returns Stripe URL and order number', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      const orderNumber = await submitCheckoutAndIntercept(page);
      expect(orderNumber).toBeTruthy();
    });

    test('confirmation page shows "Thank You!" heading', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      const orderNumber = await submitCheckoutAndIntercept(page);
      await page.goto(`/checkout/confirmation?order=${orderNumber}`);
      await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible();
    });

    test('confirmation page shows a success message', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      const orderNumber = await submitCheckoutAndIntercept(page);
      await page.goto(`/checkout/confirmation?order=${orderNumber}`);
      await expect(page.getByText('payment received successfully')).toBeVisible();
    });

    test('confirmation page displays the order number', async ({ page }) => {
      await addProductToCart(page, PRODUCT.slug);
      await page.goto('/checkout');
      await fillShippingForm(page);
      const orderNumber = await submitCheckoutAndIntercept(page);
      await page.goto(`/checkout/confirmation?order=${orderNumber}`);
      await expect(page.getByText(orderNumber)).toBeVisible();
      await expect(page.getByText('Order Number')).toBeVisible();
    });

    test('confirmation page has "Continue Shopping" and "Back to Home" links', async ({ page }) => {
      await page.goto('/checkout/confirmation?order=DEC-TEST1234-ABCD1234');
      const continueBtn = page.getByRole('link', { name: 'Continue Shopping' });
      await expect(continueBtn).toBeVisible();
      await expect(continueBtn).toHaveAttribute('href', '/products');
      const homeBtn = page.getByRole('link', { name: 'Back to Home' });
      await expect(homeBtn).toBeVisible();
      await expect(homeBtn).toHaveAttribute('href', '/');
    });

    test('"Continue Shopping" navigates to /products', async ({ page }) => {
      await page.goto('/checkout/confirmation?order=DEC-TEST1234-ABCD1234');
      await page.getByRole('link', { name: 'Continue Shopping' }).click();
      await expect(page).toHaveURL('/products');
    });

    test('"Back to Home" navigates to /', async ({ page }) => {
      await page.goto('/checkout/confirmation?order=DEC-TEST1234-ABCD1234');
      await page.getByRole('link', { name: 'Back to Home' }).click();
      await expect(page).toHaveURL('/');
    });

    test('full flow with expensive product uses free shipping', async ({ page }) => {
      await addProductToCart(page, EXPENSIVE.slug);
      await page.goto('/cart');
      const shippingRow = page.locator('div.flex.justify-between').filter({ hasText: 'Shipping' });
      await expect(shippingRow).toContainText('Free');

      await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
      await expect(page).toHaveURL('/checkout');

      const summaryShipping = page
        .locator('div.flex.justify-between')
        .filter({ hasText: 'Shipping' });
      await expect(summaryShipping).toContainText('Free');
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
      await page.goto('/checkout/confirmation?order=DEC-TEST1234-ABCD1234');
      await expect(page.getByRole('heading', { name: 'Thank You!' })).toBeVisible();
      await expect(page.getByText('Order Number')).toBeVisible();
      await expect(page.getByText('DEC-TEST1234-ABCD1234')).toBeVisible();
    });
  });
});
