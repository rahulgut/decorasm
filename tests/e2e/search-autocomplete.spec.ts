import { test, expect } from '@playwright/test';

/**
 * Search Autocomplete E2E tests — covers:
 *  - Typing shows suggestions dropdown
 *  - Suggestions grouped by category with headers
 *  - Search result highlighting
 *  - Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
 *  - Clicking a suggestion navigates to product page
 *  - "View all results" link navigates to /products?search=
 *  - Minimum 2 characters required to trigger suggestions
 *  - Debounced input (no request spam)
 *  - API returns suggestions for valid queries
 *  - API returns empty for short queries
 */

// ─── Search suggestions API ───────────────────────────────────────

test.describe('Search API — /api/products/search', () => {
  test('returns suggestions for valid query', async ({ request }) => {
    const res = await request.get('/api/products/search?q=cushion');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.suggestions).toBeDefined();
    expect(data.suggestions.length).toBeGreaterThan(0);
    expect(data.suggestions[0]).toHaveProperty('name');
    expect(data.suggestions[0]).toHaveProperty('slug');
    expect(data.suggestions[0]).toHaveProperty('category');
    expect(data.suggestions[0]).toHaveProperty('price');
  });

  test('returns empty for query shorter than 2 chars', async ({ request }) => {
    const res = await request.get('/api/products/search?q=a');
    const data = await res.json();
    expect(data.suggestions).toEqual([]);
  });

  test('returns empty for missing query', async ({ request }) => {
    const res = await request.get('/api/products/search');
    const data = await res.json();
    expect(data.suggestions).toEqual([]);
  });

  test('searches product descriptions too', async ({ request }) => {
    // "handwoven" appears in the Moroccan rug description/name
    const res = await request.get('/api/products/search?q=handwoven');
    const data = await res.json();
    expect(data.suggestions.length).toBeGreaterThan(0);
  });

  test('limits results to 8', async ({ request }) => {
    // Broad search that should match many products
    const res = await request.get('/api/products/search?q=er');
    const data = await res.json();
    expect(data.suggestions.length).toBeLessThanOrEqual(8);
  });
});

// ─── Autocomplete UI ──────────────────────────────────────────────

test.describe('Search Autocomplete — UI', () => {
  test('search input is visible in navbar on desktop', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await expect(searchInput).toBeVisible();
  });

  test('typing less than 2 chars does not show dropdown', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await searchInput.fill('a');
    // Wait a bit for debounce
    await page.waitForTimeout(400);
    await expect(page.locator('#search-listbox')).not.toBeVisible();
  });

  test('typing 2+ chars shows suggestions dropdown', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await searchInput.fill('cushion');
    await expect(page.locator('#search-listbox')).toBeVisible({ timeout: 5000 });
  });

  test('suggestions show product names with highlighted matches', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await searchInput.fill('cushion');
    await expect(page.locator('#search-listbox')).toBeVisible({ timeout: 5000 });

    // Should have at least one highlighted match
    await expect(page.locator('#search-listbox mark').first()).toBeVisible();
  });

  test('suggestions are grouped by category', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await searchInput.fill('cushion');
    await expect(page.locator('#search-listbox')).toBeVisible({ timeout: 5000 });

    // Category headers should be visible
    const categoryHeaders = page.locator('#search-listbox .uppercase');
    await expect(categoryHeaders.first()).toBeVisible();
  });

  test('shows "View all results" link at bottom', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await searchInput.fill('cushion');
    await expect(page.locator('#search-listbox')).toBeVisible({ timeout: 5000 });

    await expect(page.getByText('View all results for')).toBeVisible();
  });

  test('clicking a suggestion navigates to product page', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await searchInput.fill('cushion');
    await expect(page.locator('#search-listbox')).toBeVisible({ timeout: 5000 });

    // Click the first suggestion
    await page.locator('#search-listbox [role="option"]').first().click();
    await expect(page).toHaveURL(/\/products\//, { timeout: 5000 });
  });

  test('"View all results" navigates to products page with search param', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await searchInput.fill('cushion');
    await expect(page.locator('#search-listbox')).toBeVisible({ timeout: 5000 });

    await page.getByText('View all results for').click();
    await expect(page).toHaveURL(/\/products\?search=cushion/, { timeout: 5000 });
  });

  test('pressing Escape closes the dropdown', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await searchInput.fill('cushion');
    await expect(page.locator('#search-listbox')).toBeVisible({ timeout: 5000 });

    await searchInput.press('Escape');
    await expect(page.locator('#search-listbox')).not.toBeVisible();
  });
});

// ─── Keyboard navigation ─────────────────────────────────────────

test.describe('Search Autocomplete — keyboard navigation', () => {
  test('ArrowDown highlights first suggestion', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await searchInput.fill('cushion');
    await expect(page.locator('#search-listbox')).toBeVisible({ timeout: 5000 });

    await searchInput.press('ArrowDown');
    const firstOption = page.locator('#search-option-0');
    await expect(firstOption).toHaveAttribute('aria-selected', 'true');
  });

  test('ArrowDown cycles through suggestions', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    // Use a broad query to get multiple results
    await searchInput.fill('lamp');
    await expect(page.locator('#search-listbox')).toBeVisible({ timeout: 5000 });

    // ArrowDown selects first item
    await searchInput.press('ArrowDown');
    await expect(page.locator('#search-option-0')).toHaveAttribute('aria-selected', 'true');

    // ArrowDown again selects second item
    await searchInput.press('ArrowDown');
    await expect(page.locator('#search-option-1')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#search-option-0')).toHaveAttribute('aria-selected', 'false');
  });

  test('Enter on highlighted suggestion navigates to product', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await searchInput.fill('cushion');
    await expect(page.locator('#search-listbox')).toBeVisible({ timeout: 5000 });

    await searchInput.press('ArrowDown');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/products\//, { timeout: 5000 });
  });

  test('Enter without selection searches for the query', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByRole('combobox', { name: 'Search products' });
    await searchInput.fill('cushion');
    await expect(page.locator('#search-listbox')).toBeVisible({ timeout: 5000 });

    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/products\?search=cushion/, { timeout: 5000 });
  });
});
