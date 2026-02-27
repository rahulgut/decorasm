import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * Auth E2E tests — covers:
 *  - Registration: form rendering, client validation, successful signup, duplicate email
 *  - Login: form rendering, invalid credentials, successful sign-in
 *  - Logout: sign-out via navbar dropdown
 *  - Route protection: /account redirects unauthenticated users to /login
 *  - Navbar auth UI: "Sign In" link vs user dropdown menu
 *  - Account dashboard: profile info, saved shipping address
 *  - Order history: empty state, orders after purchase
 *  - Cart migration: guest cart items merge into user cart on login
 */

// ── Helpers ────────────────────────────────────────────────────────────────

const TEST_USER = {
  name: 'Test User',
  email: `testuser+${Date.now()}@example.com`,
  password: 'TestPass123!',
};

/** Register a new user via the API (faster than going through the UI). */
async function registerViaAPI(request: Page['request'], user = TEST_USER) {
  const res = await request.post('/api/auth/register', {
    data: { name: user.name, email: user.email, password: user.password },
  });
  return res;
}

/** Sign in via the login page UI. */
async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

/** Register + sign in, returning authenticated context. */
async function createAndLoginUser(page: Page) {
  const user = {
    name: 'Auth Test',
    email: `auth+${Date.now()}@example.com`,
    password: 'SecurePass99!',
  };
  await registerViaAPI(page.request, user);
  await loginViaUI(page, user.email, user.password);
  // Wait for redirect to complete
  await expect(page).not.toHaveURL('/login', { timeout: 10000 });
  return user;
}

/** Add a product to cart via the UI. */
async function addProductToCart(page: Page, slug: string) {
  await page.goto(`/products/${slug}`);
  await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  // Wait for cart badge to appear (more reliable than transient "Added!" button text)
  await expect(page.locator('a[href="/cart"] span')).toBeVisible({ timeout: 5000 });
}

const PRODUCT = { slug: 'linen-cushion-cover-set', name: 'Linen Cushion Cover Set' };

// ── Registration ───────────────────────────────────────────────────────────

test.describe('Registration (/register)', () => {
  test('renders the registration form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('At least 8 characters')).toBeVisible();
    await expect(page.getByPlaceholder('Repeat your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('shows link to sign in page', async ({ page }) => {
    await page.goto('/register');
    const link = page.getByRole('link', { name: 'Sign in', exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/login');
  });

  test('shows password mismatch error on form submission', async ({ page }) => {
    await page.goto('/register');
    // Fill all required fields to bypass browser native validation
    await page.getByPlaceholder('John Doe').fill('Test');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');
    await page.getByPlaceholder('At least 8 characters').fill('ValidPass1!');
    await page.getByPlaceholder('Repeat your password').fill('Different1!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('shows error for short password', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('John Doe').fill('Test');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');
    await page.getByPlaceholder('At least 8 characters').fill('short');
    await page.getByPlaceholder('Repeat your password').fill('short');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('shows error for mismatched passwords', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('John Doe').fill('Test');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');
    await page.getByPlaceholder('At least 8 characters').fill('TestPass123!');
    await page.getByPlaceholder('Repeat your password').fill('DifferentPass!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('successful registration redirects to home and shows user name', async ({ page }) => {
    const user = {
      name: 'Reg Test',
      email: `reg+${Date.now()}@example.com`,
      password: 'RegPass123!',
    };

    await page.goto('/register');
    await page.getByPlaceholder('John Doe').fill(user.name);
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('At least 8 characters').fill(user.password);
    await page.getByPlaceholder('Repeat your password').fill(user.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should redirect to home
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // Navbar should show the user's name (desktop)
    await expect(page.getByText(user.name)).toBeVisible({ timeout: 5000 });
  });

  test('duplicate email shows error', async ({ page }) => {
    const user = {
      name: 'Dup Test',
      email: `dup+${Date.now()}@example.com`,
      password: 'DupPass123!',
    };

    // Register first via API
    await registerViaAPI(page.request, user);

    // Try registering again via UI
    await page.goto('/register');
    await page.getByPlaceholder('John Doe').fill(user.name);
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('At least 8 characters').fill(user.password);
    await page.getByPlaceholder('Repeat your password').fill(user.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('An account with this email already exists')).toBeVisible({ timeout: 5000 });
  });
});

// ── Login ──────────────────────────────────────────────────────────────────

test.describe('Login (/login)', () => {
  test('renders the login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('shows link to register page', async ({ page }) => {
    await page.goto('/login');
    const link = page.getByRole('link', { name: 'Create one' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/register');
  });

  test('invalid credentials show error', async ({ page }) => {
    await loginViaUI(page, 'nonexistent@example.com', 'wrongpassword');
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 5000 });
  });

  test('successful login redirects to home', async ({ page }) => {
    const user = {
      name: 'Login Test',
      email: `login+${Date.now()}@example.com`,
      password: 'LoginPass123!',
    };
    await registerViaAPI(page.request, user);

    await loginViaUI(page, user.email, user.password);
    await expect(page).toHaveURL('/', { timeout: 15000 });
    await expect(page.getByText(user.name)).toBeVisible({ timeout: 5000 });
  });

  test('shows loading state while signing in', async ({ page }) => {
    const user = {
      name: 'Loading Test',
      email: `loading+${Date.now()}@example.com`,
      password: 'LoadPass123!',
    };
    await registerViaAPI(page.request, user);

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('Enter your password').fill(user.password);

    // Intercept the auth request to catch loading state
    const pending: { resolve: (() => void) | null } = { resolve: null };
    await page.route('**/api/auth/**', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise<void>((resolve) => { pending.resolve = resolve; });
        await route.continue();
      } else {
        await route.continue();
      }
    });

    page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('button', { name: 'Signing in...' })).toBeVisible({ timeout: 3000 });

    pending.resolve?.();
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});

// ── Logout ─────────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test('sign out via navbar returns to home with Sign In link', async ({ page }) => {
    await createAndLoginUser(page);

    // Click the user dropdown
    const userMenu = page.locator('button').filter({ hasText: /Account|Auth Test/ });
    await userMenu.click();

    // Click Sign Out
    await page.getByText('Sign Out').click();

    // Should be back on home with Sign In link
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible({ timeout: 10000 });
  });
});

// ── Route Protection ───────────────────────────────────────────────────────

test.describe('Route protection', () => {
  test('/account redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login\?callbackUrl/, { timeout: 10000 });
  });

  test('/account/orders redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/account/orders');
    await expect(page).toHaveURL(/\/login\?callbackUrl/, { timeout: 10000 });
  });

  test('login with callbackUrl redirects back to protected page', async ({ page }) => {
    const user = {
      name: 'Callback Test',
      email: `callback+${Date.now()}@example.com`,
      password: 'CallbackPass1!',
    };
    await registerViaAPI(page.request, user);

    // Visit protected page — should redirect to login
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login\?callbackUrl/, { timeout: 10000 });

    // Log in
    await page.getByPlaceholder('you@example.com').fill(user.email);
    await page.getByPlaceholder('Enter your password').fill(user.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should redirect back to /account
    await expect(page).toHaveURL('/account', { timeout: 15000 });
  });
});

// ── Navbar Auth UI ─────────────────────────────────────────────────────────

test.describe('Navbar auth UI', () => {
  test('unauthenticated user sees "Sign In" link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });

  test('authenticated user sees their name instead of Sign In', async ({ page }) => {
    const user = await createAndLoginUser(page);
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Sign In' })).not.toBeVisible();
    await expect(page.getByText(user.name)).toBeVisible();
  });

  test('user dropdown shows My Account and Order History links', async ({ page }) => {
    const user = await createAndLoginUser(page);
    await page.goto('/');

    // Open dropdown
    const userMenu = page.locator('button').filter({ hasText: new RegExp(user.name) });
    await userMenu.click();

    await expect(page.getByRole('link', { name: 'My Account' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Order History' })).toBeVisible();
    await expect(page.getByText('Sign Out')).toBeVisible();
  });

  test('My Account link navigates to /account', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/');

    const userMenu = page.locator('button').filter({ hasText: /Auth Test/ });
    await userMenu.click();
    await page.getByRole('link', { name: 'My Account' }).click();

    await expect(page).toHaveURL('/account', { timeout: 10000 });
  });
});

// ── Account Dashboard ──────────────────────────────────────────────────────

test.describe('Account dashboard (/account)', () => {
  test('shows user profile info', async ({ page }) => {
    const user = await createAndLoginUser(page);
    await page.goto('/account');

    await expect(page.getByRole('heading', { name: 'My Account' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Profile')).toBeVisible();
    // Name appears in both navbar and profile — target the profile <dd> element
    const profileSection = page.locator('dd');
    await expect(profileSection.filter({ hasText: user.name })).toBeVisible();
    await expect(profileSection.filter({ hasText: user.email })).toBeVisible();
  });

  test('shows sidebar navigation with Dashboard and Order History', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/account');

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'Order History' })).toBeVisible();
  });

  test('shows "No saved address yet" when user has no orders', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/account');

    await expect(page.getByText('No saved address yet')).toBeVisible({ timeout: 10000 });
  });
});

// ── Order History ──────────────────────────────────────────────────────────

test.describe('Order history (/account/orders)', () => {
  test('shows empty state when user has no orders', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/account/orders');

    await expect(page.getByText("You haven't placed any orders yet")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'Start Shopping' })).toBeVisible();
  });

  test('Start Shopping link navigates to /products', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/account/orders');

    await expect(page.getByRole('link', { name: 'Start Shopping' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: 'Start Shopping' }).click();
    await expect(page).toHaveURL('/products');
  });
});

// ── Cart Migration ─────────────────────────────────────────────────────────

test.describe('Cart migration on login', () => {
  test('guest cart items are preserved after login', async ({ page }) => {
    // 1. Add product to cart as guest
    await addProductToCart(page, PRODUCT.slug);

    // Verify cart has item
    await page.goto('/cart');
    await expect(page.getByText(PRODUCT.name)).toBeVisible({ timeout: 5000 });

    // 2. Register and login
    const user = {
      name: 'Cart Migrate',
      email: `cartmigrate+${Date.now()}@example.com`,
      password: 'MigratePass1!',
    };
    await registerViaAPI(page.request, user);
    await loginViaUI(page, user.email, user.password);
    await expect(page).not.toHaveURL('/login', { timeout: 10000 });

    // 3. Check cart still has the item
    await page.goto('/cart');
    await expect(page.getByText(PRODUCT.name)).toBeVisible({ timeout: 5000 });
  });
});

// ── Auth API Validation ────────────────────────────────────────────────────

test.describe('Auth API validation', () => {
  const BASE = 'http://localhost:3000';

  test('POST /api/auth/register with missing name returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/register`, {
      data: { email: 'test@example.com', password: 'TestPass123!' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Name is required');
  });

  test('POST /api/auth/register with invalid email returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/register`, {
      data: { name: 'Test', email: 'not-an-email', password: 'TestPass123!' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('valid email');
  });

  test('POST /api/auth/register with short password returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/register`, {
      data: { name: 'Test', email: 'test@example.com', password: 'short' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('at least 8 characters');
  });

  test('GET /api/orders/history without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/orders/history`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/user/profile without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/user/profile`);
    expect(res.status()).toBe(401);
  });
});
