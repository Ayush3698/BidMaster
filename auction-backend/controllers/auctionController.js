const Auction = require('../models/Auction');
const Bid     = require('../models/Bid');
const User    = require('../models/User');

// ── Create Auction ─────────────────────────────────────────
// POST /api/auctions
const createAuction = async (req, res) => {
  try {
    const { title, description, imageUrl, category, startingPrice, reservePrice, buyNowPrice, startTime, endTime } = req.body;
    const now = new Date();
    const auction = await Auction.create({
      title, description, imageUrl, category,
      startingPrice, reservePrice, buyNowPrice,
      startTime, endTime,
      seller: req.user._id,
      status: new Date(startTime) <= now ? 'active' : 'upcoming',
    });
    res.status(201).json({ success: true, auction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get All Auctions ───────────────────────────────────────
// GET /api/auctions?status=active&category=Art&page=1&limit=10
const getAuctions = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;

    const auctions = await Auction.find(filter)
      .populate('seller', 'name email')
      .populate('winner', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Auction.countDocuments(filter);
    res.json({ success: true, auctions, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Single Auction ─────────────────────────────────────
// GET /api/auctions/:id
const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('winner', 'name email')
      .populate({ path: 'bids', populate: { path: 'bidder', select: 'name' }, options: { sort: { amount: -1 } } });
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });
    res.json({ success: true, auction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update Auction ─────────────────────────────────────────
// PUT /api/auctions/:id
const updateAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });

    const isOwner = auction.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (auction.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cannot edit a closed auction' });
    }

    const updated = await Auction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, auction: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Close Auction ──────────────────────────────────────────
// PUT /api/auctions/:id/close
const closeAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });

    const isOwner = auction.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const highestBid = await Bid.findOne({ auction: auction._id }).sort({ amount: -1 }).populate('bidder');

    auction.status  = 'closed';
    auction.endTime = new Date();

    if (highestBid) {
      auction.winner = highestBid.bidder._id;

      // Charge winner wallet
      const winner = await User.findById(highestBid.bidder._id);
      if (winner.walletBalance < highestBid.amount) {
        return res.status(400).json({ success: false, message: 'Winner has insufficient wallet balance' });
      }
      winner.walletBalance -= highestBid.amount;
      winner.walletTransactions.push({ type: 'won', amount: -highestBid.amount, description: `Won: ${auction.title}` });
      await winner.save();

      // Credit seller
      const seller = await User.findById(auction.seller);
      seller.walletBalance += highestBid.amount;
      seller.walletTransactions.push({ type: 'deposit', amount: highestBid.amount, description: `Sold: ${auction.title}` });
      await seller.save();

      // Notify via socket
      const io = req.app.get('io');
      io.to(auction._id.toString()).emit('auctionClosed', {
        auctionId:  auction._id,
        winner:     { name: winner.name, _id: winner._id },
        finalPrice: highestBid.amount,
      });
    }

    await auction.save();
    res.json({ success: true, message: 'Auction closed', auction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Delete Auction ─────────────────────────────────────────
// DELETE /api/auctions/:id
const deleteAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });

    const isOwner = auction.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Bid.deleteMany({ auction: auction._id });
    await auction.deleteOne();
    res.json({ success: true, message: 'Auction deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── My Auctions ────────────────────────────────────────────
// GET /api/auctions/my
const getMyAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, auctions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createAuction, getAuctions, getAuctionById, updateAuction, closeAuction, deleteAuction, getMyAuctions };
