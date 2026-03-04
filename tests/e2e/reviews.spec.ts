import { test, expect, type Page } from '@playwright/test';

/**
 * Product Reviews E2E tests — covers:
 *  - Unauthenticated: shows "Sign in to write a review" prompt
 *  - Authenticated: submit a review with rating, title, body
 *  - Reviews list: shows submitted review on product page
 *  - Delete: user can delete their own review
 *  - Validation: rating/title/body required, duplicate review blocked
 *  - Star rating: interactive stars work
 *  - Product card: shows average rating after review
 *  - API: unauthenticated POST/DELETE return 401
 */

const PRODUCT = { slug: 'linen-cushion-cover-set', name: 'Linen Cushion Cover Set' };

async function registerUser(request: Page['request']) {
  const user = {
    name: 'Review Tester',
    email: `review+${Date.now()}@example.com`,
    password: 'ReviewPass1!',
  };
  await request.post('/api/auth/register', {
    data: { name: user.name, email: user.email, password: user.password },
  });
  return user;
}

async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).not.toHaveURL('/login', { timeout: 10000 });
}

async function createAndLoginUser(page: Page) {
  const user = await registerUser(page.request);
  await loginViaUI(page, user.email, user.password);
  // Wait for session to hydrate
  await expect(page.getByLabel(/Wishlist/)).toBeVisible({ timeout: 10000 });
  return user;
}

function productUrl() {
  return `/products/${PRODUCT.slug}`;
}

/** Click a star in the interactive review form (scoped to the radiogroup). */
async function clickFormStar(page: Page, stars: number) {
  const label = stars === 1 ? '1 star' : `${stars} stars`;
  await page.getByRole('radiogroup').getByRole('button', { name: label }).click();
}

// ─── Unauthenticated ───────────────────────────────────────────────

test.describe('Reviews — unauthenticated', () => {
  test('shows sign-in prompt instead of review form', async ({ page }) => {
    await page.goto(productUrl());
    await expect(page.getByText('Sign in to write a review')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Write a Review' })).not.toBeVisible();
  });

  test('API rejects unauthenticated POST', async ({ request }) => {
    const res = await request.post('/api/reviews', {
      data: { productId: '000000000000000000000000', rating: 5, title: 'Test', body: 'Test body' },
    });
    expect(res.status()).toBe(401);
  });

  test('API rejects unauthenticated DELETE', async ({ request }) => {
    const res = await request.delete('/api/reviews/000000000000000000000000');
    expect(res.status()).toBe(401);
  });
});

// ─── Review form validation ────────────────────────────────────────

test.describe('Reviews — form validation', () => {
  test('requires rating before submit', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto(productUrl());

    // Fill title and body but skip rating
    await page.getByPlaceholder('Summarize your experience').fill('Great product');
    await page.getByPlaceholder('What did you like or dislike').fill('Loved it!');
    await page.getByRole('button', { name: 'Submit Review' }).click();

    await expect(page.getByText('Please select a rating')).toBeVisible();
  });

  test('requires title before submit', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto(productUrl());

    // Click 5 stars via form radiogroup, fill body, skip title
    await clickFormStar(page, 5);
    await page.getByPlaceholder('What did you like or dislike').fill('Loved it!');
    await page.getByRole('button', { name: 'Submit Review' }).click();

    await expect(page.getByText('Please add a title')).toBeVisible();
  });

  test('requires body before submit', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto(productUrl());

    // Click 5 stars, fill title, skip body
    await clickFormStar(page, 5);
    await page.getByPlaceholder('Summarize your experience').fill('Great');
    await page.getByRole('button', { name: 'Submit Review' }).click();

    await expect(page.getByText('Please write a review')).toBeVisible();
  });
});

// ─── Submit and display ────────────────────────────────────────────

test.describe('Reviews — submit and display', () => {
  test('submits a review and displays it on the page', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto(productUrl());

    // Fill review form
    await clickFormStar(page, 4);
    await page.getByPlaceholder('Summarize your experience').fill('Beautiful product');
    await page.getByPlaceholder('What did you like or dislike').fill('The quality is excellent and it looks great in my living room.');
    await page.getByRole('button', { name: 'Submit Review' }).click();

    // Review should appear in the list
    await expect(page.locator('h4').filter({ hasText: 'Beautiful product' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('p').filter({ hasText: 'The quality is excellent' }).first()).toBeVisible();
  });

  test('prevents duplicate reviews for same product', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto(productUrl());

    // Submit first review
    await clickFormStar(page, 5);
    await page.getByPlaceholder('Summarize your experience').fill('Dup test review');
    await page.getByPlaceholder('What did you like or dislike').fill('First review body for dup test.');
    await page.getByRole('button', { name: 'Submit Review' }).click();
    await expect(page.locator('h4').filter({ hasText: 'Dup test review' })).toBeVisible({ timeout: 5000 });

    // Reload the page to get a clean form, then try duplicate
    await page.goto(productUrl());
    await expect(page.getByRole('heading', { name: 'Write a Review' })).toBeVisible({ timeout: 5000 });

    await clickFormStar(page, 3);
    await page.getByPlaceholder('Summarize your experience').fill('Second attempt');
    await page.getByPlaceholder('What did you like or dislike').fill('Trying a second review.');
    await page.getByRole('button', { name: 'Submit Review' }).click();

    await expect(page.locator('form div[role="alert"]')).toContainText('already reviewed', { timeout: 10000 });
  });

  test('deletes own review', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto(productUrl());

    // Submit review
    await clickFormStar(page, 4);
    await page.getByPlaceholder('Summarize your experience').fill('To be deleted');
    await page.getByPlaceholder('What did you like or dislike').fill('This review will be deleted.');
    await page.getByRole('button', { name: 'Submit Review' }).click();
    await expect(page.getByText('To be deleted')).toBeVisible({ timeout: 5000 });

    // Delete it
    await page.getByRole('button', { name: 'Delete review' }).click();
    await expect(page.getByText('To be deleted')).not.toBeVisible({ timeout: 5000 });
  });
});

// ─── Star rating interaction ───────────────────────────────────────

test.describe('Reviews — star rating', () => {
  test('clicking stars updates the rating visually', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto(productUrl());

    // Click 3 stars in the form radiogroup
    await clickFormStar(page, 3);

    // The form's radiogroup should have 5 star buttons
    const formStars = page.getByRole('radiogroup').getByRole('button');
    await expect(formStars).toHaveCount(5);
  });
});

// ─── Average rating on product cards ───────────────────────────────

test.describe('Reviews — product card rating', () => {
  test('shows average rating on product listing after review exists', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto(productUrl());

    // Submit a 5-star review
    await clickFormStar(page, 5);
    await page.getByPlaceholder('Summarize your experience').fill('Card rating test');
    await page.getByPlaceholder('What did you like or dislike').fill('Testing that the average shows on cards.');
    await page.getByRole('button', { name: 'Submit Review' }).click();
    await expect(page.locator('h4').filter({ hasText: 'Card rating test' }).first()).toBeVisible({ timeout: 5000 });

    // Go to products listing and check for rating display
    await page.goto('/products');
    // The product card should show a star rating with count (at least 1 review)
    const productCard = page.locator(`a[href="/products/${PRODUCT.slug}"]`);
    await expect(productCard.getByText(/\(\d+\)/)).toBeVisible({ timeout: 10000 });
  });
});

// ─── Reviews section header ────────────────────────────────────────

test.describe('Reviews — section display', () => {
  test('shows "Customer Reviews" heading on product page', async ({ page }) => {
    await page.goto(productUrl());
    const heading = page.getByRole('heading', { name: 'Customer Reviews' });
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('shows aggregate rating after reviews exist', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto(productUrl());

    // Submit a review
    await clickFormStar(page, 4);
    await page.getByPlaceholder('Summarize your experience').fill('Aggregate test');
    await page.getByPlaceholder('What did you like or dislike').fill('Testing aggregate display.');
    await page.getByRole('button', { name: 'Submit Review' }).click();
    await expect(page.locator('h4').filter({ hasText: 'Aggregate test' }).first()).toBeVisible({ timeout: 5000 });

    // Should show "Based on X review(s)"
    await expect(page.getByText(/Based on \d+ review/)).toBeVisible();
  });
});
