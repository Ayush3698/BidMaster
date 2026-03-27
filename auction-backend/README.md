# 🏛️ Auction Backend — Setup Guide

## Tech Stack
- **Node.js + Express** — API server
- **MongoDB** — Database
- **Socket.io** — Real-time bidding
- **JWT** — Authentication
- **Stripe** — Wallet deposits

---

## 📁 Folder Structure

```
auction-backend/
├── server.js                  ← Start here
├── .env.example               ← Copy to .env
├── api.js                     ← Copy to your React src/ folder
├── config/db.js
├── models/
│   ├── User.js
│   ├── Auction.js
│   └── Bid.js
├── controllers/
│   ├── authController.js
│   ├── auctionController.js
│   ├── bidController.js
│   └── walletController.js
├── routes/
│   ├── authRoutes.js
│   ├── auctionRoutes.js
│   ├── bidRoutes.js
│   └── walletRoutes.js
├── middleware/authMiddleware.js
├── socket/socketHandler.js
└── utils/autoCloseAuctions.js
```

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1 — Install MongoDB (if not installed)
Download from: https://www.mongodb.com/try/download/community
Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas

### STEP 2 — Install dependencies
```bash
cd auction-backend
npm install
```

### STEP 3 — Set up environment variables
```bash
cp .env.example .env
```

Now open `.env` and fill in:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/auction_db
JWT_SECRET=any_long_random_string_here_like_abc123xyz789
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_xxxxxxx   ← from stripe.com dashboard
STRIPE_WEBHOOK_SECRET=whsec_xxxxxx  ← from stripe.com webhooks
CLIENT_URL=http://localhost:5173
```

### STEP 4 — Start the backend
```bash
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
⏱  Auto-close scheduler started
```

### STEP 5 — Connect to your React frontend

1. Install axios and socket.io-client in your React project:
```bash
cd your-react-project
npm install axios socket.io-client
```

2. Copy `api.js` from this folder into your React `src/` folder

3. Use it anywhere in your React components:
```js
import { loginUser, getAuctions, placeBid, connectSocket } from './api'

// Login
const { data } = await loginUser({ email, password })
localStorage.setItem('token', data.token)

// Get auctions
const { data } = await getAuctions({ status: 'active' })

// Place bid
const { data } = await placeBid(auctionId, 5000)

// Real-time bidding
const socket = connectSocket()
socket.emit('joinAuction', auctionId)
socket.on('newBid', (data) => console.log('New bid:', data))
socket.on('auctionClosed', (data) => console.log('Winner:', data))
```

---

## 🔌 API Endpoints

### AUTH
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | /api/auth/register | ❌ | Register |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Get profile |
| PUT | /api/auth/update | ✅ | Update profile |

### AUCTIONS
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | /api/auctions | ❌ | Get all auctions |
| GET | /api/auctions/:id | ❌ | Get one auction |
| GET | /api/auctions/my | ✅ | My auctions |
| POST | /api/auctions | ✅ | Create auction |
| PUT | /api/auctions/:id | ✅ | Update auction |
| PUT | /api/auctions/:id/close | ✅ | Close auction |
| DELETE | /api/auctions/:id | ✅ | Delete auction |

### BIDS
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | /api/bids/:auctionId | ✅ | Place bid |
| GET | /api/bids/:auctionId | ❌ | Get bids |
| GET | /api/bids/my | ✅ | My bids |

### WALLET
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | /api/wallet | ✅ | Balance + history |
| POST | /api/wallet/deposit | ✅ | Stripe deposit |
| POST | /api/wallet/withdraw | ✅ | Withdraw |
| POST | /api/wallet/webhook | ❌ | Stripe webhook |

---

## ⚡ Socket.io Events

### Frontend → Backend
| Event | Data | Description |
|-------|------|-------------|
| joinAuction | auctionId | Watch auction live |
| leaveAuction | auctionId | Stop watching |

### Backend → Frontend
| Event | Data | Description |
|-------|------|-------------|
| joinedAuction | { auctionId } | Confirmed join |
| newBid | { auctionId, currentPrice, bid } | Someone bid |
| auctionClosed | { auctionId, winner, finalPrice } | Auction ended |
