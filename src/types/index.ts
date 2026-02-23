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
  createdAt: string;
  updatedAt: string;
}
