import { test, expect, type Page } from '@playwright/test';

/**
 * Cart page (/cart) tests — covers:
 *  - Empty cart state with EmptyState component
 *  - "Browse Products" link from empty state
 *  - Cart item rendering after adding a product
 *  - Line total calculation
 *  - Order summary: subtotal, shipping, total
 *  - Free shipping threshold ($100 / 10000 cents)
 *  - Quantity stepper inside cart (increase / decrease)
 *  - Removing an item from the cart
 *  - Cart badge in navbar reflects item count
 *  - "Proceed to Checkout" button
 *
 * Each test starts from a fresh browser context so the session cookie is new
 * and the cart is always empty at the start of every test.
 */

// Helper: adds a product to the cart via the product detail page and then
// navigates to /cart.
async function addProductToCart(
  page: Page,
  slug: string,
  quantity = 1
): Promise<void> {
  await page.goto(`/products/${slug}`);
  await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible();

  // Set desired quantity using the stepper if quantity > 1
  if (quantity > 1) {
    const addSection = page.locator('div').filter({ hasText: 'Add to Cart' }).last();
    const incrementBtn = addSection.locator('button', { hasText: '+' });
    for (let i = 1; i < quantity; i++) {
      await incrementBtn.click();
    }
  }

  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByRole('button', { name: 'Added to cart' })).toBeVisible({ timeout: 5000 });
  await page.goto('/cart');
  // Wait for the cart to finish loading (the loading text disappears)
  await expect(page.getByText('Loading cart...')).not.toBeVisible({ timeout: 5000 });
}

// ── Seed products used across tests ────────────────────────────────────────
// Linen Cushion Cover Set: price 5900 cents = $59.00 — below free-shipping threshold alone
// Moroccan Handwoven Rug: price 79900 cents = $799.00 — above threshold alone
const CHEAP_PRODUCT = { slug: 'linen-cushion-cover-set', name: 'Linen Cushion Cover Set', price: 5900 };
const EXPENSIVE_PRODUCT = { slug: 'moroccan-handwoven-rug', name: 'Moroccan Handwoven Rug', price: 79900 };
const CHAIR_PRODUCT = { slug: 'mid-century-lounge-chair', name: 'Mid-Century Lounge Chair', price: 89900 };

test.describe('Cart page (/cart)', () => {
  // ── Empty cart state ─────────────────────────────────────────────────────

  test.describe('Empty cart', () => {
    test('displays "Your Cart" heading on an empty cart', async ({ page }) => {
      await page.goto('/cart');
      // exact: true prevents matching the EmptyState's "Your cart is empty" heading
      await expect(
        page.getByRole('heading', { name: 'Your Cart', exact: true })
      ).toBeVisible();
    });

    test('shows EmptyState with "Your cart is empty" message', async ({ page }) => {
      await page.goto('/cart');
      await expect(page.getByText('Your cart is empty')).toBeVisible({ timeout: 5000 });
    });

    test('shows descriptive empty-state sub-text', async ({ page }) => {
      await page.goto('/cart');
      await expect(
        page.getByText("Looks like you haven't added any items yet")
      ).toBeVisible({ timeout: 5000 });
    });

    test('"Browse Products" link navigates to /products', async ({ page }) => {
      await page.goto('/cart');
      const browseLink = page.getByRole('link', { name: 'Browse Products' });
      await expect(browseLink).toBeVisible({ timeout: 5000 });
      await browseLink.click();
      await expect(page).toHaveURL('/products');
    });
  });

  // ── Cart item rendering ──────────────────────────────────────────────────

  test.describe('Cart item display', () => {
    test('added product appears in cart with name and unit price', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      await expect(page.getByText(CHEAP_PRODUCT.name)).toBeVisible();
      await expect(page.getByText('$59.00 each')).toBeVisible();
    });

    test('cart item shows a product image', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      const img = page.getByRole('img', { name: CHEAP_PRODUCT.name });
      await expect(img).toBeVisible();
    });

    test('cart item image links to the product detail page', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      const imgLink = page.locator(`a[href="/products/${CHEAP_PRODUCT.slug}"]`).first();
      await expect(imgLink).toBeVisible();
    });

    test('line total equals unit price x quantity (1 item)', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      // Line total for 1x $59.00 should be $59.00
      // It is rendered in the right-hand column of the cart item row
      const lineTotal = page.locator('div.text-right p.font-semibold');
      await expect(lineTotal.first()).toContainText('$59.00');
    });

    test('line total updates when quantity is changed (2 items)', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug, 2);
      // 2 × $59.00 = $118.00
      const lineTotal = page.locator('div.text-right p.font-semibold');
      await expect(lineTotal.first()).toContainText('$118.00');
    });
  });

  // ── Quantity stepper in cart ─────────────────────────────────────────────

  test.describe('Quantity stepper', () => {
    test('quantity stepper shows current quantity', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      // The quantity span is between the - and + buttons
      const qtySpan = page.locator('span').filter({ hasText: /^1$/ });
      await expect(qtySpan.first()).toBeVisible();
    });

    test('clicking "+" increases quantity by 1', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);

      // Find the + button inside the cart item row (not any other + button)
      const cartItemRow = page.locator('div.border-b').first();
      const incrementBtn = cartItemRow.locator('button', { hasText: '+' });
      await incrementBtn.click();

      // Quantity should now be 2
      await expect(
        cartItemRow.locator('span').filter({ hasText: /^2$/ })
      ).toBeVisible({ timeout: 5000 });
    });

    test('line total updates when "+" is clicked', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);

      const cartItemRow = page.locator('div.border-b').first();
      const incrementBtn = cartItemRow.locator('button', { hasText: '+' });
      await incrementBtn.click();

      // 2 × $59.00 = $118.00
      await expect(
        page.locator('div.text-right p.font-semibold').first()
      ).toContainText('$118.00', { timeout: 5000 });
    });

    test('clicking "-" decreases quantity by 1', async ({ page }) => {
      // Start with 2 items
      await addProductToCart(page, CHEAP_PRODUCT.slug, 2);

      const cartItemRow = page.locator('div.border-b').first();
      const decrementBtn = cartItemRow.locator('button', { hasText: '-' });
      await decrementBtn.click();

      await expect(
        cartItemRow.locator('span').filter({ hasText: /^1$/ })
      ).toBeVisible({ timeout: 5000 });
    });

    test('decrementing to 0 removes the item from the cart', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);

      const cartItemRow = page.locator('div.border-b').first();
      const decrementBtn = cartItemRow.locator('button', { hasText: '-' });
      await decrementBtn.click(); // quantity goes to 0 → item removed

      // The cart should be empty now
      await expect(
        page.getByText('Your cart is empty')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  // ── Remove item button ───────────────────────────────────────────────────

  test.describe('Remove item', () => {
    test('"Remove" button deletes the item from the cart', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);

      const removeBtn = page.getByRole('button', { name: 'Remove' });
      await expect(removeBtn).toBeVisible();
      await removeBtn.click();

      // Cart should revert to empty state
      await expect(
        page.getByText('Your cart is empty')
      ).toBeVisible({ timeout: 5000 });
    });

    test('removing one of multiple items leaves the remaining items', async ({ page }) => {
      // Add two different products
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      // Go back and add a second distinct product
      await page.goto(`/products/${EXPENSIVE_PRODUCT.slug}`);
      await page.getByRole('button', { name: 'Add to Cart' }).click();
      await expect(page.getByRole('button', { name: 'Added to cart' })).toBeVisible({ timeout: 5000 });
      await page.goto('/cart');
      await expect(page.getByText('Loading cart...')).not.toBeVisible({ timeout: 5000 });

      // Verify both items are present
      await expect(page.getByText(CHEAP_PRODUCT.name)).toBeVisible();
      await expect(page.getByText(EXPENSIVE_PRODUCT.name)).toBeVisible();

      // Remove the first item — click the Remove button adjacent to CHEAP_PRODUCT
      const cheapItemRow = page.locator('div.border-b').filter({ hasText: CHEAP_PRODUCT.name });
      await cheapItemRow.getByRole('button', { name: 'Remove' }).click();

      // Only the expensive product should remain
      await expect(page.getByText(CHEAP_PRODUCT.name)).not.toBeVisible({ timeout: 5000 });
      await expect(page.getByText(EXPENSIVE_PRODUCT.name)).toBeVisible();
    });
  });

  // ── Order Summary (CartSummary component) ───────────────────────────────

  test.describe('Order Summary', () => {
    test('displays "Order Summary" heading', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      await expect(page.getByRole('heading', { name: 'Order Summary' })).toBeVisible();
    });

    test('subtotal reflects the item total', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      // Subtotal line: "Subtotal (1 items)"
      await expect(page.getByText('Subtotal (1 items)')).toBeVisible();
      // The subtotal value
      const subtotalRow = page.locator('div.flex.justify-between').filter({ hasText: 'Subtotal' });
      await expect(subtotalRow).toContainText('$59.00');
    });

    test('shipping is $9.99 for orders under $100', async ({ page }) => {
      // $59.00 is under the $100 free-shipping threshold
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      const shippingRow = page.locator('div.flex.justify-between').filter({ hasText: 'Shipping' });
      await expect(shippingRow).toContainText('$9.99');
    });

    test('total = subtotal + shipping (under threshold)', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      // $59.00 + $9.99 = $68.99
      const totalRow = page
        .locator('div.border-t')
        .filter({ hasText: 'Total' })
        .last();
      await expect(totalRow).toContainText('$68.99');
    });

    test('shipping is Free for orders over $100', async ({ page }) => {
      // Moroccan Handwoven Rug is $799.00 — well above $100 threshold
      await addProductToCart(page, EXPENSIVE_PRODUCT.slug);
      const shippingRow = page.locator('div.flex.justify-between').filter({ hasText: 'Shipping' });
      await expect(shippingRow).toContainText('Free');
    });

    test('total = subtotal when shipping is free', async ({ page }) => {
      await addProductToCart(page, EXPENSIVE_PRODUCT.slug);
      // $799.00 + $0 = $799.00
      const totalRow = page
        .locator('div.border-t')
        .filter({ hasText: 'Total' })
        .last();
      await expect(totalRow).toContainText('$799.00');
    });

    test('shows "add X more for free shipping" hint when below threshold', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      // Remaining = $100 - $59 = $41.00
      await expect(page.getByText(/more for free shipping/i)).toBeVisible();
    });

    test('"Proceed to Checkout" button is visible and links to /checkout', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      const checkoutBtn = page.getByRole('link', { name: 'Proceed to Checkout' });
      await expect(checkoutBtn).toBeVisible();
      await expect(checkoutBtn).toHaveAttribute('href', '/checkout');
    });

    test('"Proceed to Checkout" navigates to /checkout', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
      await expect(page).toHaveURL('/checkout');
    });
  });

  // ── Navbar cart badge ────────────────────────────────────────────────────

  test.describe('Navbar cart badge', () => {
    test('badge shows correct item count after adding 1 item', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      const badge = page.locator('a[href="/cart"] span');
      await expect(badge).toHaveText('1');
    });

    test('badge shows correct count when adding multiple quantities', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug, 3);
      const badge = page.locator('a[href="/cart"] span');
      await expect(badge).toHaveText('3');
    });

    test('badge disappears after all items are removed', async ({ page }) => {
      await addProductToCart(page, CHEAP_PRODUCT.slug);
      await page.getByRole('button', { name: 'Remove' }).click();
      await expect(page.getByText('Your cart is empty')).toBeVisible({ timeout: 5000 });

      // Badge should be gone
      const badge = page.locator('a[href="/cart"] span');
      await expect(badge).not.toBeVisible();
    });
  });
});
