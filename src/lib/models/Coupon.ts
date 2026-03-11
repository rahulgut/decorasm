import { Schema, model, models } from 'mongoose';

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percent', 'fixed'],
    },
    discountValue: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxUses: { type: Number, default: 0 },
    maxUsesPerUser: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 },
    usedBy: { type: [String], default: [] },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 });

const Coupon = models.Coupon || model('Coupon', CouponSchema);
export default Coupon;
