// ─────────────────────────────────────────────────────────────
//  api.js  —  all routes matched to server.js exactly
// ─────────────────────────────────────────────────────────────
import { io } from "socket.io-client";

const BASE = "";
let socket = null;

// ── helpers ──────────────────────────────────────────────────
// ✅ FIXED: was localStorage — must match App.js which uses sessionStorage
function getToken() {
  return sessionStorage.getItem("jwt_token");
}

async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ═══════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════

export async function loginUser(walletAddress) {
  return req("POST", "/api/auth/wallet", { walletAddress });
}

export async function getMe() {
  return req("GET", "/api/auth/me");
}

// ═══════════════════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════════════════

export async function updateProfile(formData) {
  return req("PUT", "/api/users/profile", formData);
}

export async function getProfile(walletAddress) {
  return req("GET", `/api/users/profile/${walletAddress}`);
}

// ═══════════════════════════════════════════════════════════
//  AUCTIONS
// ═══════════════════════════════════════════════════════════

export async function getAuctions() {
  return req("GET", "/api/auctions");
}

export async function getMyAuctions() {
  return req("GET", "/api/auctions/my");
}

export async function getAuction(id) {
  return req("GET", `/api/auctions/${id}`);
}

export async function saveAuction(data) {
  return req("POST", "/api/auctions", data);
}

export async function deleteAuction(id) {
  return req("DELETE", `/api/auctions/${id}`);
}

// ═══════════════════════════════════════════════════════════
//  BIDS
// ═══════════════════════════════════════════════════════════

export async function getMyBids() {
  return req("GET", "/api/bids/my");
}

export async function getBids(auctionId) {
  return req("GET", `/api/bids/${auctionId}`);
}

export async function saveBid(data) {
  return req("POST", "/api/bids", data);
}

// ═══════════════════════════════════════════════════════════
//  WALLET
// ═══════════════════════════════════════════════════════════

export async function getWallet() {
  return req("GET", "/api/wallet");
}

// ═══════════════════════════════════════════════════════════
//  COMPLAINTS
// ═══════════════════════════════════════════════════════════

export async function submitComplaint(data) {
  return req("POST", "/api/complaints", data);
}

// ═══════════════════════════════════════════════════════════
//  SOCKET.IO
// ═══════════════════════════════════════════════════════════

export function connectSocket(walletAddress) {
  if (socket?.connected) return;

  socket = io({
    auth: { token: getToken() },
    query: { walletAddress },
  });

  socket.on("connect", () =>
    console.log("🔌 Socket connected:", socket.id)
  );
  socket.on("connect_error", (err) =>
    console.warn("⚠️ Socket error:", err.message)
  );

  window._socket = socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  window._socket = null;
}

export function joinAuction(auctionId) {
  socket?.emit("join_auction", { auctionId });
}

export function leaveAuction(auctionId) {
  socket?.emit("leave_auction", { auctionId });
}

export function onNewBid(callback) {
  socket?.on("new_bid", callback);
  return () => socket?.off("new_bid", callback);
}

export function onAuctionEnded(callback) {
  socket?.on("auction_ended", callback);
  return () => socket?.off("auction_ended", callback);
}

export function onNewAuction(callback) {
  socket?.on("new_auction", callback);
  return () => socket?.off("new_auction", callback);
}