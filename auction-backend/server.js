require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { ethers } = require("ethers");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

// ── Middlewares ──────────────────────────────────────────────
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ── Video upload setup ───────────────────────────────────────
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "uploads/videos");
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || ".mp4";
        cb(null, `video_${Date.now()}${ext}`);
    },
});
const videoUpload = multer({
    storage: videoStorage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("video/")) cb(null, true);
        else cb(new Error("Only video files allowed"));
    },
});

app.post("/api/upload-video", videoUpload.single("video"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No video file received" });
    const url = `/uploads/videos/${req.file.filename}`;
    res.json({ url });
});

// ── MongoDB connect ──────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/auctiondb")
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.warn("⚠️ MongoDB failed:", err.message));

// ── Mongoose Schemas ─────────────────────────────────────────
const UserSchema = new mongoose.Schema({
    walletAddress: { type: String, unique: true, lowercase: true },
    username: String,
    fullName: String,
    email: String,
    profileCompleted: { type: Boolean, default: false },
    totalBids: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 },
    totalCreated: { type: Number, default: 0 },
}, { timestamps: true });

const AuctionSchema = new mongoose.Schema({
    auctionId: String,
    walletAddress: String,
    title: String,
    category: String,
    description: String,
    imageUrl: String,
    status: { type: String, default: "active" },
    endsAt: Date,
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
const Auction = mongoose.model("Auction", AuctionSchema);

// ── JWT Middleware ───────────────────────────────────────────
function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "No token" });
    try {
        req.user = jwt.verify(header.replace("Bearer ", ""), JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

const makeToken = (user) => jwt.sign(
    { id: user._id, walletAddress: user.walletAddress },
    JWT_SECRET,
    { expiresIn: "7d" }
);

// ── Routes ───────────────────────────────────────────────────
app.post("/api/auth/wallet", async (req, res) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });
        const addr = walletAddress.toLowerCase();
        let user = await User.findOne({ walletAddress: addr });
        if (!user) user = await User.create({ walletAddress: addr });
        res.json({ token: makeToken(user), user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/auctions", async (req, res) => {
    try {
        const auctions = await Auction.find({ status: "active" }).sort({ createdAt: -1 });
        res.json({ auctions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/auctions/:id", auth, async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).json({ error: "Auction not found" });
        if (auction.walletAddress.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        await Auction.findByIdAndDelete(req.params.id);
        res.json({ message: "Auction deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Socket.io Connection ──────────────────────────────────────
io.on("connection", (socket) => {
    socket.on("join_auction", (auctionId) => {
        socket.join(`auction_${auctionId}`);
    });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 BidMaster Server running on port ${PORT}`);
});
