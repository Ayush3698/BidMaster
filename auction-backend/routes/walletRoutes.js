const express = require('express');
const router  = express.Router();
const { getWallet, createDepositIntent, stripeWebhook, withdraw } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',          protect, getWallet);
router.post('/deposit',  protect, createDepositIntent);
router.post('/withdraw', protect, withdraw);
router.post('/webhook',  stripeWebhook); // No auth — Stripe calls this directly

module.exports = router;
