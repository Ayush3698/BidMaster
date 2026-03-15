const express = require('express');
const router  = express.Router();
const { placeBid, getAuctionBids, getMyBids } = require('../controllers/bidController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my',          protect, getMyBids);
router.get('/:auctionId',  getAuctionBids);
router.post('/:auctionId', protect, placeBid);

module.exports = router;
