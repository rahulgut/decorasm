import { Schema, model, models } from 'mongoose';

const WishlistItemSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  },
  { timestamps: true }
);

// One wishlist entry per user-product pair
WishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

const WishlistItem = models.WishlistItem || model('WishlistItem', WishlistItemSchema);
export default WishlistItem;
