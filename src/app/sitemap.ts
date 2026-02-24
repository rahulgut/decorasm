import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { IProduct } from '@/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://decorasm.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();
  const products = (await Product.find({}, { slug: 1, updatedAt: 1 }).lean()) as unknown as IProduct[];

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/products?category=furniture`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/products?category=lighting`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/products?category=wall-art`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/products?category=textiles`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/products?category=accessories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    ...productUrls,
  ];
}
