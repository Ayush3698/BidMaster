import { useState, useEffect } from "react";
import ConnectWallet from "./ConnectWallet";
import AuctionFormComplete from "./AuctionFormComplete";
import AuctionLobby from "./Auctionlobby";
import AuctionHistory from "./Auctionhistory";
import BidMasterDashboard from "./Dashboard";
import Profile from "./Profile";

import { loginUser, updateProfile, connectSocket, disconnectSocket } from "./api";
import { registerUserOnChain } from "./blockchain";

export default function App() {
  const [step, setStep] = useState(1);
  const [walletAddress, setWallet] = useState("");
  const [userData, setUserData] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [authLoading, setAuthLoading] = useState(false);

  // ── On mount: clear everything so fresh connection is always required ──
  useEffect(() => {
    // Clear session on every fresh page load / browser open
    // MetaMask stays connected at extension level but our app forgets the session
    sessionStorage.clear();
    setStep(1);
    setWallet("");
    setUserData(null);

    // Also listen for tab/browser close → clear session
    const handleUnload = () => {
      sessionStorage.clear();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // ── Step 1 → 2/3: wallet connected ───────────────────────
  const handleWalletConnected = async (addr) => {
    if (!addr || addr.length < 10) {
      console.error("Invalid wallet address");
      return;
    }

    setWallet(addr);
    setAuthLoading(true);

    try {
      const result = await loginUser(addr);
      console.log("🔐 loginUser result:", result);

      const { token, user } = result;

      if (!token) {
        setAuthLoading(false);
        setStep(2);
        return;
      }

      sessionStorage.setItem("jwt_token", token);

      if (user && user.profileCompleted === true) {
        setUserData(user);
        connectSocket(addr);
        setAuthLoading(false);
        setStep(3);
        setPage("dashboard");
      } else {
        setAuthLoading(false);
        setStep(2);
      }

    } catch (err) {
      console.error("Login failed:", err.message);
      setAuthLoading(false);
      setStep(2);
    }
  };

  // ── Step 2 → 3: profile form submitted ───────────────────
  const handleFormComplete = async (formData) => {
    try {
      const { token, user } = await updateProfile({ ...formData, walletAddress });
      if (token) sessionStorage.setItem("jwt_token", token);
      setUserData(user || formData);

      // ✅ registerUserOnChain REMOVED — was causing gas fee transaction popup
      // Profile is saved to backend only (no blockchain transaction needed for signup)

      connectSocket(walletAddress);
      setStep(3);
      setPage("dashboard");
    } catch (err) {
      console.error("Profile save failed:", err.message);
      setSubmitError(err.message || "Profile save failed. Please try again.");
    }
  };
  // ── Profile updated ───────────────────────────────────────
  const handleUserUpdate = (updatedUser) => {
    setUserData(updatedUser);
  };

  // ── Disconnect ────────────────────────────────────────────
  const handleDisconnect = () => {
    disconnectSocket();
    setWallet("");
    setUserData(null);
    setStep(1);
    setPage("dashboard");
    sessionStorage.clear();
  };

  // ── Navigate ──────────────────────────────────────────────
  const handleNavigate = (dest) => {
    if (["lobby", "history", "dashboard", "profile"].includes(dest)) {
      setPage(dest);
    }
  };

  // ── Safety net ────────────────────────────────────────────
  if (step > 1 && !walletAddress) {
    setStep(1);
    return null;
  }

  // ── Loading screen ────────────────────────────────────────
  if (authLoading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0c29, #1a1a2e, #16213e)',
      color: '#a78bfa', fontFamily: 'Inter, sans-serif', gap: 16
    }}>
      <div style={{
        width: 48, height: 48,
        border: '3px solid rgba(167,139,250,0.2)',
        borderTop: '3px solid #a78bfa',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>
        Checking your account…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Step 1: Connect Wallet ────────────────────────────────
  if (step === 1) return (
    <ConnectWallet
      onConnected={handleWalletConnected}
      onDisconnected={handleDisconnect}
    />
  );

  // ── Step 2: Profile Form (new users only) ─────────────────
  if (step === 2) return (
    <AuctionFormComplete
      walletAddress={walletAddress}
      onComplete={handleFormComplete}
    />
  );

  // ── Step 3: Main App ──────────────────────────────────────
  if (step === 3) {
    if (page === "history") return (
      <AuctionHistory
        walletAddress={walletAddress}
        userData={userData}
        onNavigate={handleNavigate}
      />
    );
    if (page === "lobby") return (
      <AuctionLobby
        walletAddress={walletAddress}
        userData={userData}
        onNavigate={handleNavigate}
      />
    );
    if (page === "profile") return (
      <Profile
        walletAddress={walletAddress}
        userData={userData}
        onNavigate={handleNavigate}
        onUserUpdate={handleUserUpdate}
      />
    );
    return (
      <BidMasterDashboard
        walletAddress={walletAddress}
        userData={userData}
        onNavigate={handleNavigate}
      />
    );
  }

  return null;
}