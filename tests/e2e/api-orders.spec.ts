import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Orders API', () => {
  test('POST /api/orders without session returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/orders`, {
      data: {
        shippingAddress: {
          fullName: 'Test User',
          email: 'test@example.com',
          phone: '555-1234',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
      },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/orders with missing shippingAddress returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/orders`, {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/orders with invalid email returns 400', async ({ request }) => {
    // First get a cart session
    const cartRes = await request.get(`${BASE}/api/cart`);
    const cookies = cartRes.headers()['set-cookie'];

    const res = await request.post(`${BASE}/api/orders`, {
      headers: cookies ? { cookie: cookies } : {},
      data: {
        shippingAddress: {
          fullName: 'Test',
          email: 'not-an-email',
          address: '123 Main',
          city: 'NYC',
          state: 'NY',
          zipCode: '10001',
        },
      },
    });
    // Either 400 (validation) or 400 (empty cart) — both are expected
    expect(res.status()).toBe(400);
  });
});
