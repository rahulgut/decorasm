export type Category = 'furniture' | 'lighting' | 'wall-art' | 'textiles' | 'accessories';

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // in cents
  category: Category;
  images: string[];
  dimensions?: string;
  material?: string;
  inStock: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICartItem {
  product: IProduct;
  quantity: number;
}

export interface ICart {
  _id: string;
  sessionId: string;
  items: ICartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: IShippingAddress;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  stripeSessionId?: string;
  paymentStatus?: 'unpaid' | 'paid' | 'failed';
  couponCode?: string;
  discountAmount?: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICoupon {
  _id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  maxUsesPerUser: number;
  usageCount: number;
  usedBy: string[];
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IWishlistItem {
  _id: string;
  productId: IProduct;
  createdAt: string;
}

export interface ISharedWishlist {
  _id: string;
  userId: string;
  shareToken: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  shippingAddress?: IShippingAddress;
  createdAt: string;
  updatedAt: string;
}
