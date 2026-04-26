const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

const getIo = (req) => req.app.get('io');

/* POST /api/bids/:auctionId */
const placeBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount, currency, txHash, walletAddress } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ message: 'Invalid bid amount' });
    }

    const bidAmount = parseFloat(amount);

    const auction = await Auction.findById(auctionId);
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    if (auction.status !== 'active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }

    const currentHigh = parseFloat(auction.currentBid || auction.openBid || 0);
    if (bidAmount <= currentHigh) {
      return res.status(400).json({ message: `Bid must exceed current highest: ${currentHigh}` });
    }

    const bid = await Bid.create({
      auction: auctionId,
      auctionId: auctionId,          // ← ADD: store auctionId directly for easy lookup
      bidder: req.user?._id || null,
      amount: bidAmount,
      currency: currency || auction.currency || 'USD',
      txHash: txHash || null,
      walletAddress: walletAddress || req.user?.walletAddress || null,
    });

    await Auction.findByIdAndUpdate(auctionId, {
      currentBid: bidAmount,
      $inc: { bidderCount: 1 },
    });

    const io = getIo(req);
    if (io) {
      io.to(String(auction._id)).emit("newBid", {
        auctionId: String(auction._id),
        amount: String(bidAmount),
        currency: bid.currency,
        walletAddress: walletAddress || null,
        createdAt: bid.createdAt,
      });
    }

    res.status(201).json({ success: true, bid });

  } catch (err) {
    console.error('placeBid error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

/* GET /api/bids/:auctionId */
const getAuctionBids = async (req, res) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ bids });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET /api/bids/my */
const getMyBids = async (req, res) => {
  try {
    const walletAddress = req.query.wallet || req.user?.walletAddress;
    
    // Search by both bidder ID and walletAddress (case-insensitive)
    const query = walletAddress
      ? {
          $or: [
            { bidder: req.user?._id },
            { walletAddress: { $regex: new RegExp(`^${walletAddress}$`, 'i') } }
          ]
        }
      : { bidder: req.user._id };

    const bids = await Bid.find(query)
      .populate('auction', 'title headline imageUrl image status currentBid category description grade currency createdAt')
      .sort({ createdAt: -1 });

    // Flatten auction data into each bid for easy frontend use
    const enriched = bids.map(b => {
      const a = b.auction || {};
      return {
        _id: b._id,
        auctionId: b.auction?._id || b.auctionId,
        amount: b.amount,
        currency: b.currency,
        walletAddress: b.walletAddress,
        createdAt: b.createdAt,
        // Auction fields
        title: a.title || a.headline || 'Unknown Item',
        imageUrl: a.imageUrl || a.image || '',
        category: a.category || '—',
        description: a.description || '',
        grade: a.grade || '',
        status: a.status || 'active',
        currentBid: a.currentBid || b.amount,
        auctionCreatedAt: a.createdAt,
      };
    });

    res.json({ bids: enriched });
  } catch (err) {
    console.error('getMyBids error:', err.message);
    res.status(500).json({ bids: [], message: err.message });
  }
};

module.exports = { placeBid, getAuctionBids, getMyBids };