// ════════════════════════════════════════════════════════════
//  blockchain.js  —  Drop into /src, replace api.js
//  Matches AuctionHouse.sol v3 (split AuctionMeta/AuctionState)
// ════════════════════════════════════════════════════════════

import { ethers } from "ethers";

// ── PASTE YOUR DEPLOYED CONTRACT ADDRESS HERE ───────────────
export const CONTRACT_ADDRESS = "0x7f69F7A96a757675B83B22317a33f70166698cDa";

export const CONTRACT_ABI = [
    // Events
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

// ════════════════════════════════════════════════════════════
//  PROVIDER / SIGNER HELPERS
// ════════════════════════════════════════════════════════════

export function getProvider() {
    if (typeof window !== "undefined" && window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
    }
    throw new Error("MetaMask not found. Please install it.");
}

export async function getSigner() {
    return getProvider().getSigner();
}

export async function getReadContract() {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getProvider());
}

export async function getWriteContract() {
    const signer = await getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// ════════════════════════════════════════════════════════════
//  WALLET
// ════════════════════════════════════════════════════════════

export async function connectMetaMask() {
    if (!window.ethereum) throw new Error("MetaMask is not installed!");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    return accounts[0];
}

export async function getCurrentAddress() {
    if (!window.ethereum) return null;
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    return accounts[0] || null;
}

// ════════════════════════════════════════════════════════════
//  USER PROFILE
// ════════════════════════════════════════════════════════════

export async function registerUserOnChain(formData) {
    const contract = await getWriteContract();
    const tx = await contract.registerUser(
        formData.username || "",
        formData.email || "",
        formData.country || "",
        formData.defaultCurrency || "USD"
    );
    await tx.wait();
    return tx.hash;
}

export async function fetchUserProfile(address) {
    const contract = await getReadContract();
    const r = await contract.getProfile(address);
    return {
        username: r[0],
        email: r[1],
        country: r[2],
        defaultCurrency: r[3],
        registered: r[4],
        totalBidsPlaced: Number(r[5]),
        totalAuctionsWon: Number(r[6]),
        totalAuctionsCreated: Number(r[7]),
    };
}

// ════════════════════════════════════════════════════════════
//  CREATE AUCTION
// ════════════════════════════════════════════════════════════

/**
 * Create an auction from ConsignmentForm data.
 *
 * form.openBid / form.reserve / form.buyNow should be ETH strings, e.g. "0.5"
 * form.auctionDays: "3d" | "7d" | "14d" | "21d" | "30d"
 */
export async function createAuction(form) {
    const contract = await getWriteContract();

    const daysMap = { "3d": 259200, "7d": 604800, "14d": 1209600, "21d": 1814400, "30d": 2592000 };

    const tx = await contract.createAuction({
        title: form.headline || "Untitled Auction",
        category: form.category || "Collectibles",
        imageUrl: form.imagePreview || "",
        description: form.description || "",
        startingBid: ethers.parseEther(String(form.openBid || "0.01")),
        reservePrice: form.reserve ? ethers.parseEther(String(form.reserve)) : 0n,
        buyNowPrice: form.buyNow ? ethers.parseEther(String(form.buyNow)) : 0n,
        durationSeconds: daysMap[form.auctionDays] ?? 604800,
    });

    const receipt = await tx.wait();

    // Extract new auction ID from the AuctionCreated event log
    const iface = new ethers.Interface(CONTRACT_ABI);
    let newId = null;
    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog(log);
            if (parsed && parsed.name === "AuctionCreated") {
                newId = Number(parsed.args.id);
                break;
            }
        } catch (_) { /* skip non-matching logs */ }
    }

    return { txHash: tx.hash, auctionId: newId };
}

// ════════════════════════════════════════════════════════════
//  BID / BUY / END / CANCEL
// ════════════════════════════════════════════════════════════

/** Place a bid. ethAmount is a string like "0.15" (ETH) */
export async function placeBid(auctionId, ethAmount) {
    const contract = await getWriteContract();
    const tx = await contract.placeBid(auctionId, { value: ethers.parseEther(String(ethAmount)) });
    await tx.wait();
    return tx.hash;
}

export async function executeBuyNow(auctionId, ethAmount) {
    const contract = await getWriteContract();
    const tx = await contract.buyNow(auctionId, { value: ethers.parseEther(String(ethAmount)) });
    await tx.wait();
    return tx.hash;
}

export async function finalizeAuction(auctionId) {
    const contract = await getWriteContract();
    const tx = await contract.endAuction(auctionId);
    await tx.wait();
    return tx.hash;
}

export async function cancelAuction(auctionId) {
    const contract = await getWriteContract();
    const tx = await contract.cancelAuction(auctionId);
    await tx.wait();
    return tx.hash;
}

export async function withdrawFunds() {
    const contract = await getWriteContract();
    const tx = await contract.withdraw();
    await tx.wait();
    return tx.hash;
}

// ════════════════════════════════════════════════════════════
//  READ — merge meta + state into one clean object
// ════════════════════════════════════════════════════════════

function mergeAuction(id, m, s) {
    const now = Math.floor(Date.now() / 1000);
    return {
        id,
        seller: m.seller,
        title: m.title,
        category: m.category,
        imageUrl: m.imageUrl,
        description: m.description,
        startingBid: ethers.formatEther(m.startingBid),
        reservePrice: ethers.formatEther(m.reservePrice),
        buyNowPrice: m.buyNowPrice > 0n ? ethers.formatEther(m.buyNowPrice) : null,
        currentBid: ethers.formatEther(s.currentBid),
        highestBidder: s.highestBidder,
        endTime: Number(s.endTime),
        totalBids: Number(s.totalBids),
        ended: s.ended,
        cancelled: s.cancelled,
        isActive: !s.ended && !s.cancelled && Number(s.endTime) > now,
        endsIn: Math.max(0, Number(s.endTime) - now),
    };
}

export async function fetchAuction(auctionId) {
    const contract = await getReadContract();
    const [m, s] = await Promise.all([
        contract.getAuctionMeta(auctionId),
        contract.getAuctionState(auctionId),
    ]);
    return mergeAuction(auctionId, m, s);
}

export async function fetchAllAuctions() {
    const contract = await getReadContract();
    const count = Number(await contract.getAuctionCount());
    if (count === 0) return [];

    // Fetch all meta + state in parallel
    const ids = Array.from({ length: count }, (_, i) => i + 1);
    const results = await Promise.all(
        ids.map(id =>
            Promise.all([
                contract.getAuctionMeta(id),
                contract.getAuctionState(id),
            ]).then(([m, s]) => mergeAuction(id, m, s))
        )
    );
    return results;
}

export async function fetchBids(auctionId) {
    const contract = await getReadContract();
    const raw = await contract.getBids(auctionId);
    return raw.map(b => ({
        bidder: b.bidder,
        amount: ethers.formatEther(b.amount),
        timestamp: Number(b.timestamp),
        timeAgo: timeSince(Number(b.timestamp)),
    })).reverse();
}

export async function fetchPendingWithdrawal(address) {
    const contract = await getReadContract();
    return ethers.formatEther(await contract.getPendingWithdrawal(address));
}

export async function fetchUserHistory(address) {
    const contract = await getReadContract();
    const [created, bidOn, won] = await Promise.all([
        contract.getUserAuctions(address),
        contract.getUserBidHistory(address),
        contract.getUserWonAuctions(address),
    ]);
    return {
        created: created.map(Number),
        bidOn: bidOn.map(Number),
        won: won.map(Number),
    };
}

// ════════════════════════════════════════════════════════════
//  REAL-TIME EVENT LISTENERS
// ════════════════════════════════════════════════════════════

export async function listenToBids(auctionId, callback) {
    const contract = await getReadContract();
    const filter = contract.filters.BidPlaced(auctionId);
    contract.on(filter, (id, bidder, amount, timestamp, event) => {
        callback({
            auctionId: Number(id),
            bidder,
            amount: ethers.formatEther(amount),
            timestamp: Number(timestamp),
            txHash: event.transactionHash,
        });
    });
    return () => contract.off(filter);
}

export async function listenToAuctionEnded(callback) {
    const contract = await getReadContract();
    contract.on("AuctionEnded", (id, winner, amount, event) => {
        callback({ auctionId: Number(id), winner, amount: ethers.formatEther(amount), txHash: event.transactionHash });
    });
    return () => contract.off("AuctionEnded");
}

// ════════════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════════════

function timeSince(ts) {
    const s = Math.floor(Date.now() / 1000) - ts;
    if (s < 60) return `${ s }s ago`;
    if (s < 3600) return `${ Math.floor(s / 60) }m ago`;
    if (s < 86400) return `${ Math.floor(s / 3600) }h ago`;
    return `${ Math.floor(s / 86400) }d ago`;
}

export function shortAddress(addr) {
    if (!addr) return "—";
    return `${ addr.slice(0, 6) }...${ addr.slice(-4) }`;
}

/** Legacy shim — keeps your original api.js import working */
export async function getAuctions() {
    return { data: await fetchAllAuctions() };
}