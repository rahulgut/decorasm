import Stripe from 'stripe';

// Use a placeholder during build (page data collection) when env vars aren't available.
// Actual API calls will fail at runtime if the key is truly missing.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder_build_only');
