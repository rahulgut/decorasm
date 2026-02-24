import Image from 'next/image';
import Link from 'next/link';
import { IProduct } from '@/types';
import { formatPrice, capitalize } from '@/lib/utils';
import Badge from '../ui/Badge';

interface ProductCardProps {
  product: IProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative aspect-square overflow-hidden bg-charcoal-50">
          <Image
            src={product.images[0] || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {product.featured && (
            <div className="absolute top-3 left-3">
              <Badge variant="brand">Featured</Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs text-charcoal-400 uppercase tracking-wide mb-1">
            {capitalize(product.category)}
          </p>
          <h3 className="font-medium text-charcoal-800 group-hover:text-brand-700 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-brand-700 font-semibold mt-1">{formatPrice(product.price)}</p>
        </div>
      </div>
    </Link>
  );
}
