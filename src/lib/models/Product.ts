import mongoose, { Schema, model, models } from 'mongoose';

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true }, // in cents
    category: {
      type: String,
      required: true,
      enum: ['furniture', 'lighting', 'wall-art', 'textiles', 'accessories'],
    },
    images: { type: [String], default: [] },
    dimensions: { type: String },
    material: { type: String },
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ featured: 1 });

const Product = models.Product || model('Product', ProductSchema);
export default Product;
