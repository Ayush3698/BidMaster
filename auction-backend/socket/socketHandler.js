// socket.js — event names MUST match api.js frontend exactly
// Frontend emits:   "joinAuction", "leaveAuction"
// Frontend listens: "newBid", "auctionEnded", "newAuction", "joinedAuction", "bidError"

const Auction = require('./models/Auction');
const Bid     = require('./models/Bid');

const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── Join auction room ─────────────────────────────────────
    socket.on('joinAuction', (auctionId) => {
      const room = String(auctionId);
      socket.join(room);
      console.log(`👤 ${socket.id} joined room: ${room}`);
      socket.emit('joinedAuction', { auctionId: room, message: 'You are now watching live' });
    });

    // ── Leave auction room ────────────────────────────────────
    socket.on('leaveAuction', (auctionId) => {
      const room = String(auctionId);
      socket.leave(room);
      console.log(`👋 ${socket.id} left room: ${room}`);
    });

    // ── Optional: place bid via socket directly ───────────────
    socket.on('placeBid', async (data) => {
      try {
        const { auctionId, amount, currency, walletAddress, txHash } = data;
        const room = String(auctionId);

        if (!auctionId || !amount || isNaN(parseFloat(amount))) {
          return socket.emit('bidError', { message: 'Invalid bid data' });
        }

        const bidAmount = parseFloat(amount);
        const auction   = await Auction.findById(auctionId);

        if (!auction)                    return socket.emit('bidError', { message: 'Auction not found' });
        if (auction.status !== 'active') return socket.emit('bidError', { message: 'Auction is not active' });

        const currentHigh = parseFloat(auction.currentBid || auction.openBid || 0);
        if (bidAmount <= currentHigh) {
          return socket.emit('bidError', { message: `Bid must exceed ${currentHigh}` });
        }

        await Bid.create({
          auction: auctionId, amount: bidAmount,
          currency: currency || auction.currency || 'USD',
          walletAddress: walletAddress || null, txHash: txHash || null,
        });

        await Auction.findByIdAndUpdate(auctionId, {
          currentBid: bidAmount, $inc: { bidderCount: 1 },
        });

        const payload = {
          auctionId: room, amount: String(bidAmount),
          currency: currency || auction.currency || 'USD',
          walletAddress: walletAddress || null,
          bidder: walletAddress || 'Anonymous',
          timestamp: new Date().toISOString(),
        };

        io.to(room).emit('newBid', payload);
        console.log(`💰 newBid → room ${room}: ${bidAmount}`);

      } catch (err) {
        console.error('placeBid socket error:', err.message);
        socket.emit('bidError', { message: err.message || 'Bid failed' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;