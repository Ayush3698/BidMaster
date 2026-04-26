const express = require('express');
const router  = express.Router();
const {
  createAuction, getAuctions, getAuctionById,
  updateAuction, closeAuction, deleteAuction, getMyAuctions,
} = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',          getAuctions);
router.get('/my',        protect, getMyAuctions);
router.get('/:id',       getAuctionById);
router.post('/',         protect, createAuction);
router.put('/:id',       protect, updateAuction);
router.put('/:id/close', protect, closeAuction);
router.delete('/:id',    protect, deleteAuction);

module.exports = router;
