const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// ── Register ───────────────────────────────────────────────
// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, walletAddress } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, walletAddress });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, walletBalance: user.walletBalance,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Login ──────────────────────────────────────────────────
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, walletBalance: user.walletBalance,
        walletAddress: user.walletAddress,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get current user ───────────────────────────────────────
// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update profile ─────────────────────────────────────────
// PUT /api/auth/update
const updateProfile = async (req, res) => {
  try {
    const { name, password, phone, address, timezone, notifications, defaultCurrency } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name)            user.name = name;
    if (password)        user.password = password;
    if (phone)           user.phone = phone;
    if (address)         user.address = address;
    if (timezone)        user.timezone = timezone;
    if (notifications)   user.notifications = notifications;
    if (defaultCurrency) user.defaultCurrency = defaultCurrency;

    await user.save();
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
