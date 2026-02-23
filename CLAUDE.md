# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx playwright test --project=chromium              # Run all e2e tests
npx playwright test tests/e2e/homepage.spec.ts      # Run a single test file
npx playwright test --headed --project=chromium     # Run tests with browser UI
```

Seed the database: `curl -X POST http://localhost:3000/api/seed` (dev server must be running).

## Environment

Requires `MONGODB_URI` in `.env.local` (MongoDB connection string).

## Architecture

Next.js 16 App Router + MongoDB (Mongoose) + Tailwind CSS v4. TypeScript with `@/*` path alias mapping to `./src/*`.

**Server vs Client split:** Product pages are server components (SEO). Cart/checkout pages are client components (session-specific interactivity).

**Cart system:** Session-based via UUID cookie (no authentication). Cart state managed through React Context (`CartProvider` in `src/hooks/useCart.tsx`) wrapping the entire app in the root layout. All cart mutations go through `/api/cart` REST endpoints.

**Data flow:** Client components call API routes (`src/app/api/`) which use Mongoose models (`src/lib/models/`) to interact with MongoDB. The DB connection is a cached singleton (`src/lib/mongodb.ts`).

**Prices:** Stored in cents (integers) to avoid floating-point issues. Use `formatPrice()` from `src/lib/utils.ts` for display.

**Images:** Product images are Unsplash URLs. `next.config.ts` has `images.unsplash.com` in remote patterns for `next/image`.

**Types:** All shared interfaces in `src/types/index.ts` — `IProduct`, `ICart`, `ICartItem`, `IOrder`, `IShippingAddress`.

**Mongoose models:** `Product`, `Cart`, `Order` in `src/lib/models/`. Each API route calls `dbConnect()` before querying.

## Design System

Brand palette: warm gold `#a68b5b` on cream `#fffdf9`. Fonts: Playfair Display (headings), Inter (body). Defined in `src/app/globals.css`.

## Testing

E2e tests use Playwright in `tests/e2e/`. Playwright config auto-starts the dev server. Tests require a running MongoDB instance. Default project is `chromium`.
