# Auction House Live

A real-time decentralized auction platform with live bidding, blockchain integration, and multi-currency support.

---

## Overview

Auction House Live is a full-stack auction platform that combines traditional bidding with Web3 technology. Users can list high-value assets, place live bids, track auction history, and complete payments via crypto wallets or conventional fiat methods — all in real time.

---

## Features

### Auction Lobby
- Browse all live, upcoming, and ended auctions
- Real-time bid updates via WebSocket with blockchain fallback
- Category filters across 14 asset types (Fine Art, Classic Cars, NFTs, etc.)
- Featured hero auction with live countdown timer

### Consignment (List an Item)
- Multi-image upload with drag-and-drop support
- 60+ fiat currencies and 10 crypto assets (ETH, BTC, USDT, SOL, and more)
- Flexible payment setup: crypto wallet, UPI, bank wire, escrow, and more
- Live listing preview and payout estimator (6.5% platform commission)
- Quick duration presets (1h, 6h, 12h, 1d, 3d, 7d)

### Live Auction Room
- Real-time highest bid display with bidder leaderboard
- Quick-add bid increments and manual bid input
- Auction ended state with winner announcement
- Payment modal: crypto QR, UPI QR, offline proof upload
- Printable pay slip / PDF receipt for winners

### Auction History
- Complete record of all bids placed by the user
- Win / Loss / Active status per auction
- Per-auction detail view with full specifications
- Complaint and dispute filing system

### Seller Dashboard
- Live auction cards with wishlist and grid/list toggle
- ETH wallet balance display
- Profile overview with on-chain stats

### Profile and Analytics
- Revenue and engagement area charts (7D / 30D)
- XP-based achievement system (Newcomer to Master)
- Real-time bid feed
- Full auction management: view details, delete listings
- Notification preferences

### User Registration
- 4-step onboarding: Profile, Contact, Shipping, Preferences
- Email verification with OTP
- MetaMask wallet binding
- On-chain registration via Solidity smart contract on Sepolia
- Animated particle background canvas

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5 |
| Charts | Recharts |
| Blockchain | ethers.js v6, MetaMask, Solidity |
| Network | Ethereum Sepolia Testnet |
| Real-time | Socket.IO (WebSocket) |
| Database | MongoDB |
| Payments | MetaMask, UPI, Razorpay, Stripe, Escrow |
| Image Hosting | Custom `/api/upload` endpoint |

---

## Project Structure

```
src/
├── AuctionLobbyApp.jsx     # Lobby view, live auction room, consignment form
├── AuctionHistory.jsx      # Bid history, product detail, complaint modal
├── Dashboard.jsx           # Marketplace overview, auction cards, filters
├── Profile.jsx             # Seller analytics, XP system, auction CRUD
├── AuctionForm.jsx         # 4-step user registration with MetaMask binding
├── api.js                  # All REST API calls (auctions, bids, wallet, auth)
└── blockchain.js           # ethers.js contract read/write interactions
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MetaMask browser extension
- MongoDB instance (local or Atlas)
- Sepolia testnet ETH (for on-chain features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/auction-house-live.git
cd auction-house-live

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000
```

> On-chain features require MetaMask connected to the Sepolia testnet. The app falls back to API-only mode if no wallet is detected.

---

## Smart Contract

| Property | Value |
|---|---|
| Network | Ethereum Sepolia Testnet |
| Address | `0x7f69F7A96a757675B83B22317a33f70166698cDa` |

### ABI Methods

```solidity
function registerUser(string _username, string _email, string _country, string _currency) external
function createAuction(...) external returns (uint256)
function placeBid(uint256 auctionId) external payable
```

---

## Supported Payment Methods

| Type | Methods |
|---|---|
| Crypto | MetaMask / Web3, USDT / Stablecoin |
| Digital | PayPal, Stripe, Razorpay |
| UPI / Bank | UPI (GPay, PhonePe, Paytm), NEFT / RTGS, Wire Transfer, SEPA, ACH |
| Physical | Cash on Delivery, Cheque / Demand Draft |
| Secure | Escrow Service, Letter of Credit |

---

## Supported Currencies

**Fiat** — USD, EUR, GBP, JPY, INR, AED, SGD, and 50+ more

**Crypto** — ETH, BTC, USDT, USDC, BNB, SOL, XRP, ADA, DOGE, MATIC

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

© 2026 Auction House Live. All rights reserved.
