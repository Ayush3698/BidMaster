const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    walletAddress: { type: String, default: '' },
    walletBalance: { type: Number, default: 0 },
    walletTransactions: [
      {
        type:        { type: String, enum: ['deposit', 'withdrawal', 'bid', 'refund', 'won'] },
        amount:      Number,
        description: String,
        date:        { type: Date, default: Date.now },
      },
    ],
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    stripeCustomerId: { type: String },
    avatar:   { type: String, default: '' },
    timezone: { type: String, default: '' },
    phone:    { type: String, default: '' },
    address: {
      street:  String,
      city:    String,
      state:   String,
      zip:     String,
      country: String,
    },
    notifications: {
      everyBid:    { type: Boolean, default: false },
      outbid:      { type: Boolean, default: true },
      beforeEnd:   { type: Boolean, default: true },
    },
    defaultCurrency: { type: String, default: 'USD' },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
