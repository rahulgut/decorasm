# Decorasm — Curated Home Decor E-Commerce

A full-stack MVP e-commerce web app for the home decor brand **Decorasm**. Built with Next.js 14+ (App Router), MongoDB, and Tailwind CSS.

## Features

- Browse products with search, category filters, and sorting
- Product detail pages with image gallery and specs
- Session-based cart system (UUID cookie, no auth required)
- Guest checkout with shipping form and order placement
- Responsive design with warm, elegant brand aesthetic
- Server-rendered product pages for SEO
- 17 demo products across 5 categories

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | MongoDB (via Mongoose) |
| Styling | Tailwind CSS v4, custom brand palette |
| Fonts | Playfair Display (headings), Inter (body) |
| State | React Context (cart) |
| Session | UUID cookie (no auth) |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── products/page.tsx, [slug]/page.tsx
│   ├── cart/page.tsx
│   ├── checkout/page.tsx, confirmation/page.tsx
│   └── api/
│       ├── products/route.ts, [slug]/route.ts
│       ├── cart/route.ts
│       ├── orders/route.ts
│       └── seed/route.ts
├── components/
│   ├── layout/ (Navbar, Footer, MobileMenu)
│   ├── products/ (ProductCard, ProductGrid, CategoryPills, SearchBar, AddToCartButton)
│   ├── cart/ (CartIcon, CartItem, CartSummary)
│   ├── checkout/ (ShippingForm, OrderSummary)
│   └── ui/ (Button, Input, Badge, EmptyState)
├── hooks/useCart.tsx (CartProvider + useCart hook)
├── lib/
│   ├── mongodb.ts (connection singleton)
│   ├── models/ (Product, Cart, Order)
│   ├── seed-data.ts (17 demo products)
│   └── utils.ts (formatPrice, capitalize)
└── types/index.ts
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

### Setup

```bash
# Install dependencies
npm install

# Configure environment
# Edit .env.local with your MongoDB connection string:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/decorasm?retryWrites=true&w=majority

# Start dev server
npm run dev

# Seed demo products (in another terminal)
curl -X POST http://localhost:3000/api/seed
```

Open [http://localhost:3000](http://localhost:3000) to browse the app.

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero banner, category highlights, featured products |
| `/products` | Catalog — search, category filters, responsive product grid |
| `/products/[slug]` | Product detail — images, specs, "Add to Cart" |
| `/cart` | Cart — quantity stepper, remove items, order summary |
| `/checkout` | Checkout — shipping form + order summary |
| `/checkout/confirmation` | Confirmation — thank you + order number |

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/products` | List products (search, category, sort, pagination) |
| GET | `/api/products/[slug]` | Single product by slug |
| GET | `/api/cart` | Get cart items |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart` | Update item quantity |
| DELETE | `/api/cart` | Remove item or clear cart |
| POST | `/api/orders` | Place order, clear cart |
| POST | `/api/seed` | Seed 17 demo products |

## Design System

- **Brand palette**: Warm gold/bronze (`#a68b5b`) on cream backgrounds (`#fffdf9`)
- **Typography**: Playfair Display for headings, Inter for body text
- **Aesthetic**: Elegant, minimal, warm — fitting for home decor

## Key Decisions

- **Cart via UUID cookie** — no authentication needed for MVP
- **Prices stored in cents** — avoids floating-point issues
- **Product pages as server components** — SEO + performance
- **Cart/checkout as client components** — interactive + session-specific
- **Unsplash URLs for images** — no large files in repo
- **React Context for cart state** — lightweight, no extra dependencies

## Product Categories

- Furniture (3 products)
- Lighting (3 products)
- Wall Art (3 products)
- Textiles (3 products)
- Accessories (5 products)

## Testing

### E2E Tests (Playwright)

```bash
# Run all tests headless
npx playwright test --project=chromium

# Run in headed mode (see browser UI)
npx playwright test --headed --project=chromium

# Run a specific test file
npx playwright test tests/e2e/homepage.spec.ts

# View test report
npx playwright show-report
```

Test files in `tests/e2e/`:
- `homepage.spec.ts` — hero, categories, featured products, navigation
- `products.spec.ts` — catalog grid, category filtering, search
- `product-detail.spec.ts` — product info, breadcrumb, add to cart
- `cart.spec.ts` — add/update/remove items, order summary
- `checkout.spec.ts` — form validation, full purchase flow

## Claude Code Agents

Custom agents available in `.claude/agents/` for specialized tasks:

| Agent | Command | Purpose |
|---|---|---|
| **web-test-automation** | `/agents web-test-automation` | Write Playwright e2e and integration tests |
| **accessibility-audit** | `/agents accessibility-audit` | WCAG 2.1 AA compliance audit |
| **api-testing** | `/agents api-testing` | REST API endpoint testing |
| **security-scan** | `/agents security-scan` | OWASP Top 10 vulnerability scanning |
| **performance-audit** | `/agents performance-audit` | Core Web Vitals, bundle size, query optimization |
| **seo-audit** | `/agents seo-audit` | Meta tags, structured data, sitemap |
| **visual-regression** | `/agents visual-regression` | Screenshot comparison across deploys |
| **ci-cd-setup** | `/agents ci-cd-setup` | GitHub Actions pipeline setup |
| **mobile-testing** | `/agents mobile-testing` | Responsive layout and touch interaction tests |
