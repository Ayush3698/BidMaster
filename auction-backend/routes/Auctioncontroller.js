const Auction = require('../models/Auction');

// ── Helper ────────────────────────────────────────────────────
const getIo = (req) => req.app.get('io');

/* ─────────────────────────────────────────────────────────────
   POST /api/auctions
   Creates a new auction — maps ALL ConsignmentForm fields
───────────────────────────────────────────────────────────────*/
const createAuction = async (req, res) => {
  try {
    const {
      // ConsignmentForm sends these field names:
      headline,        // → title
      category,
      openBid,         // → opening bid / currentBid
      reserve,
      buyNow,
      description,
      auctionDays,     // "3d", "7d", "14d", "21d", "30d"
      noReserve,
      grade,
      currency,
      imageUrl,        // first/main image
      images,          // extra images array
      txHash,
      auctionId,       // on-chain numeric ID (crypto only)
      walletAddress,
      status,
    } = req.body;

    if (!headline || !category || !openBid) {
      return res.status(400).json({ message: 'headline, category, and openBid are required' });
    }

    // Convert "14d" → seconds
    const daysMap = { "3d": 3, "7d": 7, "14d": 14, "21d": 21, "30d": 30 };
    const days = daysMap[auctionDays] || 14;
    const endsInSeconds = days * 24 * 3600;
    const endsAt = new Date(Date.now() + endsInSeconds * 1000);

    const auction = await Auction.create({
      title:         headline,              // ✅ map headline → title
      category:      category || 'Collectibles',
      openBid:       parseFloat(openBid),
      currentBid:    parseFloat(openBid),   // start currentBid at openBid
      reservePrice:  reserve ? parseFloat(reserve) : null,
      buyNowPrice:   buyNow  ? parseFloat(buyNow)  : null,
      description:   description || '',
      noReserve:     noReserve || false,
      grade:         grade || '',
      currency:      currency || 'USD',
      imageUrl:      imageUrl || '',        // ✅ main image stored as imageUrl
      images:        Array.isArray(images) ? images : [],  // ✅ extra images array
      endsIn:        endsInSeconds,
      endsAt:        endsAt,
      txHash:        txHash  || null,
      auctionId:     auctionId || null,     // on-chain numeric ID
      walletAddress: walletAddress || req.user?.walletAddress || null,
      seller:        req.user?._id || null,
      status:        status || 'active',
      bidderCount:   0,
    });

    // Broadcast new auction to lobby watchers
    const io = getIo(req);
    if (io) {
      io.emit('newAuction', {
        _id:         auction._id,
        title:       auction.title,
        category:    auction.category,
        currentBid:  auction.currentBid,
        imageUrl:    auction.imageUrl,
        currency:    auction.currency,
        endsIn:      auction.endsIn,
        status:      auction.status,
      });
    }

    res.status(201).json({ success: true, auction });
  } catch (err) {
    console.error('createAuction error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/auctions
   Returns all active auctions with correct field names
───────────────────────────────────────────────────────────────*/
const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .lean();

    // Recalculate endsIn dynamically so countdown is accurate
    const now = Date.now();
    const mapped = auctions.map(a => ({
      ...a,
      endsIn: a.endsAt
        ? Math.max(0, Math.floor((new Date(a.endsAt).getTime() - now) / 1000))
        : (a.endsIn || 3600),
    }));

    res.json({ auctions: mapped });
  } catch (err) {
    console.error('getAuctions error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/auctions/my
   Returns auctions created by the logged-in wallet
───────────────────────────────────────────────────────────────*/
const getMyAuctions = async (req, res) => {
  try {
    // ✅ FIX: filter by walletAddress OR seller._id so both auth methods work
    const walletAddress = req.user?.walletAddress;
    const sellerId      = req.user?._id;

    const query = {};
    if (walletAddress && sellerId) {
      query.$or = [{ walletAddress }, { seller: sellerId }];
    } else if (walletAddress) {
      query.walletAddress = walletAddress;
    } else if (sellerId) {
      query.seller = sellerId;
    } else {
      return res.json({ auctions: [] });
    }

    const auctions = await Auction.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const now = Date.now();
    const mapped = auctions.map(a => ({
      ...a,
      endsIn: a.endsAt
        ? Math.max(0, Math.floor((new Date(a.endsAt).getTime() - now) / 1000))
        : (a.endsIn || 3600),
    }));

    res.json({ auctions: mapped });
  } catch (err) {
    console.error('getMyAuctions error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/auctions/:id
───────────────────────────────────────────────────────────────*/
const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id).lean();
    if (!auction) return res.status(404).json({ message: 'Auction not found' });

    const now = Date.now();
    auction.endsIn = auction.endsAt
      ? Math.max(0, Math.floor((new Date(auction.endsAt).getTime() - now) / 1000))
      : (auction.endsIn || 3600);

    res.json({ auction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   PUT /api/auctions/:id
───────────────────────────────────────────────────────────────*/
const updateAuction = async (req, res) => {
  try {
    const auction = await Auction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    res.json({ success: true, auction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   PUT /api/auctions/:id/close
───────────────────────────────────────────────────────────────*/
const closeAuction = async (req, res) => {
  try {
    const auction = await Auction.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    );
    if (!auction) return res.status(404).json({ message: 'Auction not found' });

    const io = getIo(req);
    if (io) {
      io.to(String(req.params.id)).emit('auctionEnded', { auctionId: String(req.params.id) });
    }

    res.json({ success: true, auction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/auctions/:id
───────────────────────────────────────────────────────────────*/
const deleteAuction = async (req, res) => {
  try {
    await Auction.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  closeAuction,
  deleteAuction,
  getMyAuctions,
};