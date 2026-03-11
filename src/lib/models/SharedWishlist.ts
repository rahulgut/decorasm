import { Schema, model, models } from 'mongoose';

const SharedWishlistSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    shareToken: { type: String, required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SharedWishlist =
  models.SharedWishlist || model('SharedWishlist', SharedWishlistSchema);
export default SharedWishlist;
