import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Cart API', () => {
  test('GET /api/cart returns items array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/cart`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBe(true);
  });

  test('POST /api/cart with invalid productId returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/cart`, {
      data: { productId: 'invalid', quantity: 1 },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/cart with invalid quantity returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/cart`, {
      data: { productId: '507f1f77bcf86cd799439011', quantity: -5 },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/cart with quantity > 100 returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/cart`, {
      data: { productId: '507f1f77bcf86cd799439011', quantity: 101 },
    });
    expect(res.status()).toBe(400);
  });

  test('PUT /api/cart with invalid productId returns 400', async ({ request }) => {
    const res = await request.put(`${BASE}/api/cart`, {
      data: { productId: 'bad-id', quantity: 2 },
    });
    expect(res.status()).toBe(400);
  });

  test('DELETE /api/cart with invalid productId returns 400', async ({ request }) => {
    const res = await request.delete(`${BASE}/api/cart`, {
      data: { productId: 'bad-id' },
    });
    expect(res.status()).toBe(400);
  });
});
