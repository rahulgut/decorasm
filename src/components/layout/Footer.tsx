import Link from 'next/link';
import Logo from '../ui/Logo';

export default function Footer() {
  return (
    <footer className="bg-charcoal-800 text-charcoal-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Logo variant="light" className="h-7 w-auto mb-3" />
            <p className="text-sm text-charcoal-300 leading-relaxed">
              Curated home decor that brings warmth and elegance to every space.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-medium text-white mb-3">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products?category=furniture" className="hover:text-brand-300 transition-colors">Furniture</Link></li>
              <li><Link href="/products?category=lighting" className="hover:text-brand-300 transition-colors">Lighting</Link></li>
              <li><Link href="/products?category=wall-art" className="hover:text-brand-300 transition-colors">Wall Art</Link></li>
              <li><Link href="/products?category=textiles" className="hover:text-brand-300 transition-colors">Textiles</Link></li>
              <li><Link href="/products?category=accessories" className="hover:text-brand-300 transition-colors">Accessories</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-medium text-white mb-3">Info</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-charcoal-300">Free shipping on orders over $100</span></li>
              <li><span className="text-charcoal-300">30-day return policy</span></li>
              <li><span className="text-charcoal-300">support@decorasm.com</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-charcoal-700 mt-8 pt-8 text-center text-sm text-charcoal-400">
          &copy; {new Date().getFullYear()} Decorasm. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
