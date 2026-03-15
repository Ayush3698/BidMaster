const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl:    { type: String, default: '' },
    category:    { type: String, default: 'General' },
    startingPrice: { type: Number, required: true, min: 0 },
    currentPrice:  { type: Number },
    reservePrice:  { type: Number, default: 0 },
    buyNowPrice:   { type: Number, default: 0 },
    startTime: { type: Date, required: true },
    endTime:   { type: Date, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'closed', 'cancelled'],
      default: 'upcoming',
    },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    bids:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bid' }],
  },
  { timestamps: true }
);

// Default currentPrice = startingPrice
auctionSchema.pre('save', function (next) {
  if (!this.currentPrice) this.currentPrice = this.startingPrice;
  next();
});

module.exports = mongoose.model('Auction', auctionSchema);
