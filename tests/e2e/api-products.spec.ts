import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Products API', () => {
  test('GET /api/products returns products array with pagination', async ({ request }) => {
    const res = await request.get(`${BASE}/api/products`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('products');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.products)).toBe(true);
    expect(data.pagination).toHaveProperty('page');
    expect(data.pagination).toHaveProperty('total');
  });

  test('GET /api/products with category filter', async ({ request }) => {
    const res = await request.get(`${BASE}/api/products?category=furniture`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    for (const product of data.products) {
      expect(product.category).toBe('furniture');
    }
  });

  test('GET /api/products with search', async ({ request }) => {
    const res = await request.get(`${BASE}/api/products?search=lamp`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.products)).toBe(true);
  });

  test('GET /api/products with pagination limit capped at 100', async ({ request }) => {
    const res = await request.get(`${BASE}/api/products?limit=500`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.pagination.limit).toBeLessThanOrEqual(100);
  });

  test('GET /api/products with sort', async ({ request }) => {
    const res = await request.get(`${BASE}/api/products?sort=price-asc`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    if (data.products.length >= 2) {
      expect(data.products[0].price).toBeLessThanOrEqual(data.products[1].price);
    }
  });

  test('GET /api/products/[slug] returns a product', async ({ request }) => {
    // First get a product slug
    const listRes = await request.get(`${BASE}/api/products?limit=1`);
    const listData = await listRes.json();
    if (listData.products.length === 0) return;

    const slug = listData.products[0].slug;
    const res = await request.get(`${BASE}/api/products/${slug}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.slug).toBe(slug);
  });

  test('GET /api/products/nonexistent returns 404', async ({ request }) => {
    const res = await request.get(`${BASE}/api/products/this-product-does-not-exist`);
    expect(res.status()).toBe(404);
  });
});
