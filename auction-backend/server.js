require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const multer = require("multer");
const fs = require("fs");
const path = require("path");

app.use('/uploads', express.static('uploads'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// ── Video upload setup
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
  console.log("✅ Video uploaded:", url);
  res.json({ url });
});

app.use('/uploads/videos', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Accept-Ranges', 'bytes');
  next();
}, express.static(path.join(__dirname, 'uploads/videos')));

app.use(cors());
app.use(express.json());
const emailRoutes = require('./routes/email');
emailRoutes(app);

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

// ── MongoDB connect ──────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/auctiondb")
	.then(() => console.log("✅ MongoDB connected"))
	.catch(err => console.warn("⚠️  MongoDB failed (running without DB):", err.message));

// ── Blockchain provider (optional, non-fatal) ────────────────
let contract = null;
const CONTRACT_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			}
		],
		"name": "AuctionCancelled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "startingBid",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "endTime",
				"type": "uint256"
			}
		],
		"name": "AuctionCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "finalAmount",
				"type": "uint256"
			}
		],
		"name": "AuctionEnded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "bidder",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "BidPlaced",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "buyNow",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "BuyNowExecuted",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "cancelAuction",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "category",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "imageUrl",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "startingBid",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "reservePrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "buyNowPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "durationSeconds",
						"type": "uint256"
					}
				],
				"internalType": "struct AuctionHouse.AuctionInput",
				"name": "inp",
				"type": "tuple"
			}
		],
		"name": "createAuction",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "endAuction",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "fee",
				"type": "uint256"
			}
		],
		"name": "FeeCollected",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "placeBid",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_username",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_email",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_country",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_currency",
				"type": "string"
			}
		],
		"name": "registerUser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_permille",
				"type": "uint256"
			}
		],
		"name": "setPlatformFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_new",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "UserRegistered",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "WithdrawalMade",
		"type": "event"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "auctionBids",
		"outputs": [
			{
				"internalType": "address",
				"name": "bidder",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "auctionCounter",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAuctionCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_from",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_to",
				"type": "uint256"
			}
		],
		"name": "getAuctionIds",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "getAuctionMeta",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address payable",
						"name": "seller",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "category",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "imageUrl",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "startingBid",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "reservePrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "buyNowPrice",
						"type": "uint256"
					}
				],
				"internalType": "struct AuctionHouse.AuctionMeta",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "getAuctionState",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "currentBid",
						"type": "uint256"
					},
					{
						"internalType": "address payable",
						"name": "highestBidder",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "endTime",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalBids",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "ended",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "cancelled",
						"type": "bool"
					}
				],
				"internalType": "struct AuctionHouse.AuctionState",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "getBids",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "bidder",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct AuctionHouse.Bid[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getPendingWithdrawal",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getProfile",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "username",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "email",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "country",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "defaultCurrency",
						"type": "string"
					},
					{
						"internalType": "bool",
						"name": "registered",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "totalBidsPlaced",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalAuctionsWon",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalAuctionsCreated",
						"type": "uint256"
					}
				],
				"internalType": "struct AuctionHouse.UserProfile",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getUserAuctions",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getUserBidHistory",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getUserWonAuctions",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "isReserveMet",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "meta",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "seller",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "category",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "imageUrl",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "startingBid",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "reservePrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "buyNowPrice",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "pendingWithdrawals",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "platformFeePercent",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "state",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "currentBid",
				"type": "uint256"
			},
			{
				"internalType": "address payable",
				"name": "highestBidder",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "endTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalBids",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "ended",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "cancelled",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "timeRemaining",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userAuctions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userBidHistory",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "userProfiles",
		"outputs": [
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "email",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "country",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "defaultCurrency",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "registered",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "totalBidsPlaced",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalAuctionsWon",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalAuctionsCreated",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userWonAuctions",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

if (process.env.RPC_URL && process.env.CONTRACT_ADDRESS) {
	try {
		const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, undefined, {
			polling: true,
			pollingInterval: 15000,
		});
		contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, provider);

		contract.on("BidPlaced", (id, bidder, amount, timestamp) => {
			const data = {
				auctionId: Number(id),
				bidder,
				amount: ethers.formatEther(amount),
				timestamp: Number(timestamp),
			};
			io.to(`auction_${ Number(id) }`).emit("new_bid", data);
			console.log(`🔨 BidPlaced #${ Number(id) }: ${ data.amount } ETH by ${ bidder }`);
		});

		contract.on("AuctionEnded", (id, winner, finalAmount) => {
			io.to(`auction_${ Number(id) }`).emit("auction_ended", {
				auctionId: Number(id),
				winner,
				finalAmount: ethers.formatEther(finalAmount),
			});
		});

		provider.on("error", (err) =>
			console.warn("⚠️  Provider error:", err.message)
		);

		console.log("✅ Blockchain connected");
	} catch (err) {
		console.warn("⚠️  Blockchain setup failed:", err.message);
	}
}

// ═══════════════════════════════════════════════
//  MONGOOSE SCHEMAS
// ═══════════════════════════════════════════════

const UserSchema = new mongoose.Schema({
	walletAddress: { type: String, unique: true, lowercase: true },
	username: String,
	fullName: String,
	email: String,
	dateOfBirth: String,
	countryCode: String,
	mobileNumber: String,
	timezone: String,
	streetAddress: String,
	apartment: String,
	city: String,
	state: String,
	postalCode: String,
	country: String,
	defaultCurrency: { type: String, default: "USD" },
	taxId: String,
	notifyEveryBid: Boolean,
	notifyOutbid: Boolean,
	notifyBeforeEnd: Boolean,
	profileCompleted: { type: Boolean, default: false },
	totalBids: { type: Number, default: 0 },
	totalWon: { type: Number, default: 0 },
	totalCreated: { type: Number, default: 0 },
}, { timestamps: true });

const AuctionSchema = new mongoose.Schema({
	txHash: String,
	auctionId: String,
	walletAddress: String,
	title: String,
	headline: String,
	category: String,
	description: String,
	imageUrl: String,
	images: [String],
	openBid: String,
	reserve: String,
	buyNow: String,
	auctionDays: String,
	currentBid: String,
	bidderCount: { type: Number, default: 0 },
	status: { type: String, default: "active" },
	endsIn: Number,
	endsAt: Date,
	endDate: Date,
	startDate: Date,
	grade: String,
	currency: { type: String, default: "USD" },
	noReserve: Boolean,
	mediaTypes: { type: mongoose.Schema.Types.Mixed, default: {} },
	paymentMethod: String,
	sellerNote: String,
	mobileNumber: String,
	walletPublicKey: String,
	walletQrUrl: String,
	upiId: String,
	upiQrUrl: String,
	bankName: String,
	accountNumber: String,
	ifscCode: String,
	accountHolder: String,
}, { timestamps: true });

const BidSchema = new mongoose.Schema({
	auctionId: String,
	amount: String,
	txHash: String,
	walletAddress: String,
	winner: Boolean,
	title: String,
	category: String,
	imageUrl: String,
	status: { type: String, default: "bid" },
}, { timestamps: true });

const ComplaintSchema = new mongoose.Schema({
	auctionId: String,
	auctionTitle: String,
	reason: String,
	description: String,
	walletAddress: String,
	status: { type: String, default: "pending" },
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
const Auction = mongoose.model("Auction", AuctionSchema);
const Bid = mongoose.model("Bid", BidSchema);
const Complaint = mongoose.model("Complaint", ComplaintSchema);

// ═══════════════════════════════════════════════
//  JWT MIDDLEWARE
// ═══════════════════════════════════════════════

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

function makeToken(user) {
	return jwt.sign(
		{ id: user._id, walletAddress: user.walletAddress },
		JWT_SECRET,
		{ expiresIn: "7d" }
	);
}

// ═══════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════

app.post("/api/auth/wallet", async (req, res) => {
	try {
		const { walletAddress } = req.body;
		if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });

		const addr = walletAddress.toLowerCase();
		let user = await User.findOne({ walletAddress: addr });
		if (!user) {
			user = await User.create({ walletAddress: addr });
		}

		const token = makeToken(user);
		res.json({ token, user });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.get("/api/auth/me", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).lean();
		if (!user) return res.status(404).json({ error: "User not found" });
		res.json({ user });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ═══════════════════════════════════════════════
//  USER / PROFILE ROUTES
// ═══════════════════════════════════════════════

app.put("/api/users/profile", auth, async (req, res) => {
	try {
		const update = { ...req.body, profileCompleted: true };
		delete update.walletAddress;
		const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });

		// Save phone to userdata file
		const fs = require('fs');
		const path = require('path');
		const filePath = path.join(__dirname, 'userdata', 'users.json');
		const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : [];
		const idx = existing.findIndex(u => u.email === update.email);
		if (idx !== -1) {
			existing[idx].phone = (update.countryCode || '') + (update.mobileNumber || '');
			existing[idx].username = update.username || '';
			fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
		}
		const token = makeToken(user);
		res.json({ token, user });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.get("/api/users/profile/:walletAddress", async (req, res) => {
	try {
		const user = await User.findOne({
			walletAddress: req.params.walletAddress.toLowerCase()
		}).lean();
		if (!user) return res.status(404).json({ error: "User not found" });
		res.json({ user });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ═══════════════════════════════════════════════
//  WALLET ROUTE
// ═══════════════════════════════════════════════

app.get("/api/wallet", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).lean();
		let balance = "0.000";
		let pendingWithdrawal = "0";

		if (contract && user?.walletAddress) {
			try {
				const provider = contract.runner;
				const raw = await provider.getBalance(user.walletAddress);
				balance = parseFloat(ethers.formatEther(raw)).toFixed(4);
				const pending = await contract.getPendingWithdrawal(user.walletAddress);
				pendingWithdrawal = ethers.formatEther(pending);
			} catch (_) { /* use defaults */ }
		}

		res.json({ balance, pendingWithdrawal });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ═══════════════════════════════════════════════
//  AUCTION ROUTES — always MongoDB first ✅
// ═══════════════════════════════════════════════

// GET /api/auctions — ✅ FIXED: always reads from MongoDB
app.get("/api/auctions", async (req, res) => {
	try {
		const now = Date.now();
		const auctions = await Auction.find({ status: "active" }).sort({ createdAt: -1 }).lean();
		const mapped = auctions.map(a => ({
			...a,
			title: a.title || a.headline || "Untitled",
			endsIn: a.endsAt
				? Math.max(0, Math.floor((new Date(a.endsAt).getTime() - now) / 1000))
				: (a.endsIn || 3600),
			mediaTypes: a.mediaTypes || {},
		}));
		res.json({ auctions: mapped });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// GET /api/auctions/my
app.get("/api/auctions/my", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).lean();
		const now = Date.now();
		const auctions = await Auction.find({
			walletAddress: user?.walletAddress
		}).sort({ createdAt: -1 }).lean();
		const mapped = auctions.map(a => ({
			...a,
			title: a.title || a.headline || "Untitled",
			endsIn: a.endsAt
				? Math.max(0, Math.floor((new Date(a.endsAt).getTime() - now) / 1000))
				: (a.endsIn || 3600),
		}));
		res.json({ auctions: mapped });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// GET /api/auctions/:id
app.get("/api/auctions/:id", async (req, res) => {
	try {
		const auction = await Auction.findById(req.params.id).lean();
		if (!auction) return res.status(404).json({ error: "Not found" });
		const now = Date.now();
		auction.endsIn = auction.endsAt
			? Math.max(0, Math.floor((new Date(auction.endsAt).getTime() - now) / 1000))
			: (auction.endsIn || 3600);
		auction.title = auction.title || auction.headline || "Untitled";
		res.json(auction);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// POST /api/auctions — ✅ FIXED: saves all fields including imageUrl, title, endsAt
app.post("/api/auctions", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id);

		const {
			headline, title, category, openBid, reserve, buyNow,
			description, auctionDays, noReserve, grade, currency,
			imageUrl, images, txHash, auctionId, status, startDate,
			mediaTypes, paymentMethod, sellerNote, mobileNumber,
			walletPublicKey, walletQrUrl, upiId, upiQrUrl,
			bankName, accountNumber, ifscCode, accountHolder,
		} = req.body;

		// Convert "14d" → seconds
		let endsAt, endsInSeconds;
		if (req.body.endDate) {
			endsAt = new Date(req.body.endDate);
			endsInSeconds = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
		} else {
			const daysMap = { "3d": 3, "7d": 7, "14d": 14, "21d": 21, "30d": 30 };
			const days = daysMap[auctionDays] || 14;
			endsInSeconds = days * 24 * 3600;
			endsAt = new Date(Date.now() + endsInSeconds * 1000);
		}

		// Filter out blob URLs — include both images AND videos
		const allMedia = Array.isArray(images)
			? images.filter(u => u && !u.startsWith("blob:"))
			: [];
		const realImageUrl = imageUrl && !imageUrl.startsWith("blob:") ? imageUrl : "";
		// If imageUrl is not already in allMedia, prepend it
		const realImages = realImageUrl && !allMedia.includes(realImageUrl)
			? allMedia  // imageUrl is stored separately, extras in images[]
			: allMedia;

	const auction = await Auction.create({
			startDate: startDate ? new Date(startDate) : new Date(),
			title: title || headline || "Untitled",
			headline: headline || title || "Untitled",
			category: category || "Collectibles",
			openBid: openBid || "0",
			currentBid: openBid || "0",
			reserve: reserve || "",
			buyNow: buyNow || "",
			description: description || "",
			auctionDays: auctionDays || "14d",
			noReserve: noReserve || false,
			grade: grade || "",
			currency: currency || "USD",
			imageUrl: realImageUrl,
			images: realImages,
			endsIn: endsInSeconds,
			endsAt,
			endDate: endsAt,
			txHash: txHash || null,
			auctionId: auctionId || null,
			walletAddress: user.walletAddress,
			status: status || "active",
			bidderCount: 0,
			mediaTypes: req.body.mediaTypes || {},
			paymentMethod: req.body.paymentMethod || "",
			sellerNote: req.body.sellerNote || "",
			mobileNumber: req.body.mobileNumber || "",
			walletPublicKey: req.body.walletPublicKey || "",
			walletQrUrl: req.body.walletQrUrl || "",
			upiId: req.body.upiId || "",
			upiQrUrl: req.body.upiQrUrl || "",
			bankName: req.body.bankName || "",
			accountNumber: req.body.accountNumber || "",
			ifscCode: req.body.ifscCode || "",
			accountHolder: req.body.accountHolder || "",
		});

		await User.findByIdAndUpdate(req.user.id, { $inc: { totalCreated: 1 } });
		io.emit("new_auction", auction);
		res.json({ auction });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// DELETE /api/auctions/:id
app.delete("/api/auctions/:id", auth, async (req, res) => {
	try {
		const auction = await Auction.findById(req.params.id);
		if (!auction) return res.status(404).json({ error: "Auction not found" });

		// Only the creator can delete
		const user = await User.findById(req.user.id);
		if (auction.walletAddress !== user.walletAddress) {
			return res.status(403).json({ error: "Not authorized" });
		}

		await Auction.findByIdAndDelete(req.params.id);

		io.emit("auction_deleted", { auctionId: req.params.id });

		res.json({ success: true, message: "Auction deleted" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ═══════════════════════════════════════════════
//  BID ROUTES
// ═══════════════════════════════════════════════

app.get("/api/bids/my", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).lean();
		const bids = await Bid.find({ walletAddress: user?.walletAddress }).lean();
		res.json({ bids });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.get("/api/bids/:auctionId", async (req, res) => {
	try {
		const bids = await Bid.find({ auctionId: req.params.auctionId }).lean();
		res.json(bids);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.post("/api/bids", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		const bid = await Bid.create({
			...req.body,
			walletAddress: user.walletAddress,
		});

		// Update auction currentBid
		await Auction.findByIdAndUpdate(req.body.auctionId, {
			currentBid: String(req.body.amount),
			$inc: { bidderCount: 1 },
		});

		await User.findByIdAndUpdate(req.user.id, { $inc: { totalBids: 1 } });

		io.to(String(req.body.auctionId)).emit("new_bid", {
			auctionId: String(req.body.auctionId),
			bidder: user.walletAddress,
			walletAddress: user.walletAddress,
			amount: String(req.body.amount),
		});

		res.json({ bid });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ═══════════════════════════════════════════════
//  COMPLAINTS
// ═══════════════════════════════════════════════

app.post("/api/complaints", async (req, res) => {
	try {
		const complaint = await Complaint.create(req.body);
		res.json({ complaint });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ═══════════════════════════════════════════════
//  SOCKET.IO
// ═══════════════════════════════════════════════

io.on("connection", (socket) => {
	console.log("🔌 Socket connected:", socket.id);

	socket.on("join_auction", ({ auctionId }) => {
		socket.join(String(auctionId));
		console.log(`Socket ${ socket.id } joined room: ${ auctionId }`);
	});

	socket.on("leave_auction", ({ auctionId }) => {
		socket.leave(String(auctionId));
	});

	socket.on("disconnect", () => {
		console.log("🔌 Socket disconnected:", socket.id);
	});
});

// ═══════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Backend running on :${ PORT }`));