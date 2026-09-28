const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isDemoAccount: { type: Boolean, default: false, select: false },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', 'other'], default: 'prefer-not-to-say' },
    genderOther: { type: String, trim: true, maxlength: 60, default: '' },
    interestedCategories: { type: [String], default: [] },
    preferredBrands: { type: [String], default: [] },
    budgetRange: { type: String, default: '' },
    preferredDeviceTypes: { type: [String], default: [] },
    phone: { type: String, trim: true, maxlength: 25, default: '' },
    marketingOptIn: { type: Boolean, default: false },
    termsAccepted: { type: Boolean, default: false },
    cart: [cartItemSchema],
    emailVerified: { type: Boolean, default: true },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    emailVerificationOtpHash: { type: String, select: false },
    emailVerificationOtpExpires: { type: Date, select: false },
    emailVerificationOtpAttempts: { type: Number, default: 0, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    resetPasswordOtpHash: { type: String, select: false },
    resetPasswordOtpExpires: { type: Date, select: false },
    resetPasswordOtpAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
