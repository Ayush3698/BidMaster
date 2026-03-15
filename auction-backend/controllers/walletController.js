const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User   = require('../models/User');

// ── Get Wallet ─────────────────────────────────────────────
// GET /api/wallet
const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      walletBalance: user.walletBalance,
      walletTransactions: user.walletTransactions.sort((a, b) => b.date - a.date),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Create Stripe Deposit Intent ───────────────────────────
// POST /api/wallet/deposit
const createDepositIntent = async (req, res) => {
  try {
    const { amount } = req.body; // amount in dollars
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is $1' });
    }

    let user = await User.findById(req.user._id);

    // Create Stripe customer if not exists
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(amount * 100), // cents
      currency: 'usd',
      customer: user.stripeCustomerId,
      metadata: { userId: req.user._id.toString(), type: 'wallet_deposit' },
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Stripe Webhook (confirms payment) ─────────────────────
// POST /api/wallet/webhook
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    if (pi.metadata.type === 'wallet_deposit') {
      const user = await User.findById(pi.metadata.userId);
      if (user) {
        const dollars = pi.amount / 100;
        user.walletBalance += dollars;
        user.walletTransactions.push({ type: 'deposit', amount: dollars, description: 'Stripe wallet deposit' });
        await user.save();
      }
    }
  }
  res.json({ received: true });
};

// ── Withdraw ───────────────────────────────────────────────
// POST /api/wallet/withdraw
const withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);

    if (amount > user.walletBalance) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    user.walletBalance -= amount;
    user.walletTransactions.push({ type: 'withdrawal', amount: -amount, description: 'Wallet withdrawal' });
    await user.save();

    res.json({ success: true, walletBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getWallet, createDepositIntent, stripeWebhook, withdraw };
