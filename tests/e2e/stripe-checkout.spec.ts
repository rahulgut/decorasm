import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Stripe Checkout E2E tests — covers:
 *  - Checkout API creates Stripe session and returns redirect URL
 *  - Order created with pending/unpaid status
 *  - Verify endpoint returns order status
 *  - Cancel redirect shows message
 *  - Shipping form shows "Proceed to Payment" button
 */

// ─── Helpers ─────────────────────────────────────────────────────

async function addItemToCart(request: APIRequestContext, productSlug?: string) {
  // Get a product to add
  const productsRes = await request.get('/api/products');
  const data = await productsRes.json();
  const products = data.products || data;
  const product = productSlug
    ? products.find((p: { slug: string }) => p.slug === productSlug)
    : products[0];

  // Add to cart
  await request.post('/api/cart', {
    data: { productId: product._id, quantity: 1 },
  });
}

const validShipping = {
  fullName: 'Test Customer',
  email: 'test@example.com',
  phone: '555-123-4567',
  address: '123 Test St',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  country: 'US',
};

// ─── API Tests ───────────────────────────────────────────────────

test.describe('Stripe Checkout — API', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    await request.post('/api/seed');
  });

  test('checkout creates Stripe session and returns URL', async ({ request }) => {
    await addItemToCart(request);

    const res = await request.post('/api/orders', {
      data: { shippingAddress: validShipping },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.url).toBeDefined();
    expect(data.url).toContain('checkout.stripe.com');
    expect(data.orderNumber).toBeDefined();
    expect(data.orderNumber).toMatch(/^DEC-/);
  });

  test('order is created with pending status', async ({ request }) => {
    await addItemToCart(request);

    const res = await request.post('/api/orders', {
      data: { shippingAddress: validShipping },
    });

    const { orderNumber } = await res.json();

    // Verify order status via verify endpoint
    const verifyRes = await request.get(`/api/orders/verify?order=${orderNumber}`);
    const verifyData = await verifyRes.json();
    expect(verifyData.status).toBe('pending');
    expect(verifyData.paymentStatus).toBe('unpaid');
  });

  test('checkout fails with empty cart', async ({ request }) => {
    // Clear cart first
    await request.delete('/api/cart');

    const res = await request.post('/api/orders', {
      data: { shippingAddress: validShipping },
    });

    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  test('checkout fails with invalid shipping', async ({ request }) => {
    await addItemToCart(request);

    const res = await request.post('/api/orders', {
      data: { shippingAddress: { ...validShipping, email: 'invalid' } },
    });

    expect(res.status()).toBe(400);
  });

  test('verify returns 404 for non-existent order', async ({ request }) => {
    const res = await request.get('/api/orders/verify?order=DEC-FAKE-00000000');
    expect(res.status()).toBe(404);
  });
});

// ─── UI Tests ────────────────────────────────────────────────────

test.describe('Stripe Checkout — UI', () => {
  test.beforeAll(async ({ request }) => {
    await request.post('/api/seed');
  });

  test('checkout button says "Proceed to Payment"', async ({ page }) => {
    // Add item via the browser so cookies are shared
    await page.goto('/products');
    const firstProduct = page.locator('a[href^="/products/"]').first();
    await firstProduct.click();
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    // Wait for cart update
    await page.waitForTimeout(1000);

    await page.goto('/checkout');
    await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeVisible({ timeout: 10000 });
  });

  test('cancelled checkout shows message', async ({ page }) => {
    await page.goto('/checkout?cancelled=true');
    await expect(page.getByText('Payment was cancelled')).toBeVisible();
  });

  test('confirmation page shows thank you message', async ({ page }) => {
    await page.goto('/checkout/confirmation?order=DEC-TEST1234-ABCD1234');
    await expect(page.getByText('Thank You!')).toBeVisible();
    await expect(page.getByText('DEC-TEST1234-ABCD1234')).toBeVisible();
  });
});
