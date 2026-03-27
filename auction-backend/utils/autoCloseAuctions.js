const Auction = require('../models/Auction');
const Bid     = require('../models/Bid');
const User    = require('../models/User');

/**
 * Runs every 60s via setInterval in server.js
 * - Activates upcoming auctions whose startTime has passed
 * - Closes active auctions whose endTime has passed
 * - Awards winner and transfers funds
 */
const autoCloseAuctions = async (io) => {
  try {
    // Activate upcoming → active
    await Auction.updateMany(
      { status: 'upcoming', startTime: { $lte: new Date() } },
      { $set: { status: 'active' } }
    );

    // Find expired active auctions
    const expired = await Auction.find({
      status:  'active',
      endTime: { $lte: new Date() },
    });

    for (const auction of expired) {
      const highestBid = await Bid.findOne({ auction: auction._id })
        .sort({ amount: -1 })
        .populate('bidder');

      auction.status = 'closed';

      if (highestBid) {
        auction.winner = highestBid.bidder._id;

        const winner = await User.findById(highestBid.bidder._id);
        if (winner && winner.walletBalance >= highestBid.amount) {
          winner.walletBalance -= highestBid.amount;
          winner.walletTransactions.push({
            type:        'won',
            amount:      -highestBid.amount,
            description: `Won auction: ${auction.title}`,
          });
          await winner.save();

          const seller = await User.findById(auction.seller);
          if (seller) {
            seller.walletBalance += highestBid.amount;
            seller.walletTransactions.push({
              type:        'deposit',
              amount:      highestBid.amount,
              description: `Auction sold: ${auction.title}`,
            });
            await seller.save();
          }
        }

        if (io) {
          io.to(auction._id.toString()).emit('auctionClosed', {
            auctionId:  auction._id,
            winner:     { name: highestBid.bidder.name, _id: highestBid.bidder._id },
            finalPrice: highestBid.amount,
          });
        }
      }

      await auction.save();
      console.log(`⏰ Auto-closed: ${auction.title}`);
    }
  } catch (err) {
    console.error('Auto-close error:', err.message);
  }
};

module.exports = autoCloseAuctions;
