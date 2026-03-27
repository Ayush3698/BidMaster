import { useState, useEffect } from "react";
import SharedHeader from "./SharedHeader";
import { getWallet, getMyAuctions, deleteAuction } from "./api";
import { fetchUserProfile } from "./blockchain";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import "./Profile.css";

/* ─── Static data ────────────────────────────────────────────────────────── */
const listings = [
    { id: "AU-9021", name: "Vintage 1970s Chronograph Watch", status: "Live", bid: "$1,240.00", bids: 18, time: "2h 15m", urgent: false, img: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=80&h=80&fit=crop" },
    { id: "AU-9022", name: 'Rare First Edition "The Great Gatsby"', status: "Live", bid: "$850.00", bids: 12, time: "4h 45m", urgent: false, img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=80&h=80&fit=crop" },
    { id: "AU-9025", name: "Mid-Century Modern Lounge Chair", status: "High Interest", bid: "$2,100.00", bids: 42, time: "1d 02h", urgent: false, img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=80&h=80&fit=crop" },
    { id: "AU-9028", name: "Signed Memorabilia: 1996 Bulls Jersey", status: "Ending Soon", bid: "$4,500.00", bids: 89, time: "12m 40s", urgent: true, img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=80&h=80&fit=crop" },
    { id: "AU-9030", name: "Handcrafted Ceramic Vase – Kyoto Blue", status: "Live", bid: "$320.00", bids: 5, time: "3d 18h", urgent: false, img: "https://images.unsplash.com/photo-1612196808214-b7e239e5f7b0?w=80&h=80&fit=crop" },
];

/* Maps a listing status string to its CSS class suffixes */
const statusSlug = {
    "Live": "live",
    "High Interest": "high-interest",
    "Ending Soon": "ending-soon",
};

/* Maps each stat card to its CSS colour token */
const statColorToken = ["green", "indigo", "amber", "pink"];

/* ─── FAB items ──────────────────────────────────────────────────────────── */
const fabItems = [
    {
        label: "Dashboard", page: "dashboard",
        icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
    },
    {
        label: "Auction Lobby", page: "lobby",
        icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    },
    {
        label: "Auction History", page: "history",
        icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    },
    {
        label: "Profile", page: "profile",
        icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    },
];

/* ─── HamburgerFab ───────────────────────────────────────────────────────── */
function HamburgerFab({ onNavigate }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`fab-wrap ${ open ? "open" : "" }`}>
            <div className="fab-items">
                {fabItems.map((item, i) => (
                    <button
                        key={i}
                        className="fab-item"
                        data-tooltip={item.label}
                        onClick={() => { onNavigate(item.page); setOpen(false); }}
                    >
                        <svg viewBox="0 0 24 24">{item.icon}</svg>
                    </button>
                ))}
            </div>
            <button className="fab-main" onClick={() => setOpen(v => !v)}>
                <div className="fab-hbg"><span /><span /><span /></div>
                <div className="fab-x">×</div>
            </button>
        </div>
    );
}

/* ─── XP helper ──────────────────────────────────────────────────────────── */
function calcXP(auctions) {
    const totalBids = auctions.reduce((s, a) => s + (a.bidderCount || 0), 0);
    const totalWon = auctions.filter(a => a.status === "ended").length;
    const totalRevenue = auctions.reduce((s, a) => s + (parseFloat(a.currentBid) || 0), 0);
    const xp = (totalBids * 10) + (totalWon * 500) + Math.floor(totalRevenue / 10);

    const levels = [
        { min: 0, max: 2000, level: 1, title: "Newcomer" },
        { min: 2000, max: 5000, level: 2, title: "Bidder" },
        { min: 5000, max: 7500, level: 3, title: "Trader" },
        { min: 7500, max: 10000, level: 4, title: "Merchant" },
        { min: 10000, max: 15000, level: 5, title: "Expert" },
        { min: 15000, max: 99999, level: 6, title: "Master" },
    ];
    const current = levels.findLast(l => xp >= l.min) || levels[0];
    return { xp, level: current.level, title: current.title, nextLevelXp: current.max };
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Profile({ onNavigate, userData, walletAddress, refreshTrigger }) {
    const [activeTab, setActiveTab] = useState("7D");
    const [liveBids, setLiveBids] = useState([]);
    const [chartData7D, setChartData7D] = useState([]);
    const [chartData30D, setChartData30D] = useState([]);
    const chartData = activeTab === "7D" ? chartData7D : chartData30D;
    const [xpData, setXpData] = useState({ xp: 0, level: 1, title: "Newcomer", nextLevelXp: 2000 });
    const [liveListings, setLiveListings] = useState([]);
    const [pendingPayouts, setPendingPayouts] = useState("$12,450.00");
    const [storeViews, setStoreViews] = useState("1,240");
    const [myAuctions, setMyAuctions] = useState([]);
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [stats, setStats] = useState({
        revenue: "—", bids: "—", sold: "—", watchers: "—",
        revenueChange: null, bidsChange: null, soldChange: null,
    });

    /* ── delete handler ── */
    const handleDeleteAuction = async (auctionId, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this auction? This cannot be undone.")) return;
        try {
            await deleteAuction(auctionId);
            setMyAuctions(prev => prev.filter(a => a._id !== auctionId));
        } catch (err) {
            alert("Failed to delete auction: " + err.message);
        }
    };

    /* ── data fetch ── */
    useEffect(() => {
        if (!walletAddress) return;

        getWallet()
            .then(d => {
                if (d?.pendingWithdrawal) setPendingPayouts(`Ξ ${ parseFloat(d.pendingWithdrawal).toFixed(4) }`);
                if (d?.balance) setStoreViews(`Ξ ${ parseFloat(d.balance).toFixed(4) }`);
            })
            .catch(err => console.warn("Wallet fetch failed:", err.message));

        getMyAuctions(walletAddress)
            .then(({ auctions }) => {
                if (!auctions?.length) return;
                setMyAuctions(auctions);
                setXpData(calcXP(auctions));

                const totalBids = auctions.reduce((sum, a) => sum + (a.bidderCount || 0), 0);
                const totalRevenue = auctions.reduce((sum, a) => sum + (parseFloat(a.currentBid) || 0), 0);
                const now = Date.now();
                const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
                const twoMonthsAgo = now - 60 * 24 * 60 * 60 * 1000;

                const thisMonth = auctions.filter(a => new Date(a.createdAt) >= oneMonthAgo);
                const lastMonth = auctions.filter(a => new Date(a.createdAt) >= twoMonthsAgo && new Date(a.createdAt) < oneMonthAgo);

                const calcChange = (curr, prev) => {
                    if (!prev || prev === 0) return null;
                    const pct = ((curr - prev) / prev * 100).toFixed(1);
                    return pct >= 0 ? `+${ pct }%` : `${ pct }%`;
                };

                const thisRevenue = thisMonth.reduce((s, a) => s + (parseFloat(a.currentBid) || 0), 0);
                const lastRevenue = lastMonth.reduce((s, a) => s + (parseFloat(a.currentBid) || 0), 0);
                const thisBids = thisMonth.reduce((s, a) => s + (a.bidderCount || 0), 0);
                const lastBids = lastMonth.reduce((s, a) => s + (a.bidderCount || 0), 0);
                const thisSold = thisMonth.filter(a => a.status === "ended").length;
                const lastSold = lastMonth.filter(a => a.status === "ended").length;

                setStats({
                    revenue: totalRevenue > 0 ? `$${ totalRevenue.toLocaleString() }` : "—",
                    bids: totalBids > 0 ? totalBids.toLocaleString() : "—",
                    sold: auctions.filter(a => a.status === "ended").length.toString(),
                    watchers: auctions.reduce((s, a) => s + (a.watcherCount || 0), 0).toString(),
                    revenueChange: calcChange(thisRevenue, lastRevenue),
                    bidsChange: calcChange(thisBids, lastBids),
                    soldChange: calcChange(thisSold, lastSold),
                });

                const chartNow = new Date();
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

                const last7 = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(chartNow);
                    d.setDate(chartNow.getDate() - (6 - i));
                    return { day: dayNames[d.getDay()], date: d.toDateString(), revenue: 0, wins: 0, losses: 0 };
                });

                const last30 = Array.from({ length: 30 }, (_, i) => {
                    const d = new Date(chartNow);
                    d.setDate(chartNow.getDate() - (29 - i));
                    return { day: `${ d.getMonth() + 1 }/${ d.getDate() }`, date: d.toDateString(), revenue: 0, wins: 0, losses: 0 };
                });

                auctions.forEach(a => {
                    const aDate = new Date(a.createdAt || Date.now());
                    const aDateStr = aDate.toDateString();
                    const bid = parseFloat(a.currentBid || a.openBid || 0);
                    const isWon = a.status === "ended" && bid > 0;

                    [last7, last30].forEach(arr => {
                        const slot = arr.find(s => s.date === aDateStr);
                        if (slot) {
                            if (isWon) { slot.revenue += bid; slot.wins += 1; }
                            else { slot.losses += 1; }
                        }
                    });
                });

                const allBidFetches = auctions.map(a =>
                    fetch(`/api/bids/${ a._id }`)
                        .then(r => r.json())
                        .then(data => (data.bids || data || []).map(b => ({ ...b, auctionId: a._id, auctionStatus: a.status })))
                        .catch(() => [])
                );

                Promise.all(allBidFetches).then(allBids => {
                    const flatBids = allBids.flat();
                    flatBids.forEach(bid => {
                        const bDate = new Date(bid.createdAt || Date.now());
                        const bDateStr = bDate.toDateString();
                        const amount = parseFloat(bid.amount || 0);
                        [last7, last30].forEach(arr => {
                            const slot = arr.find(s => s.date === bDateStr);
                            if (slot) { slot.revenue += amount; }
                        });
                    });
                    setChartData7D(last7);
                    setChartData30D(last30);
                });
            })
            .catch(() => { });

        fetchUserProfile(walletAddress)
            .catch(err => console.warn("Chain profile failed:", err.message));
    }, [walletAddress, refreshTrigger]);

    /* ── derived values ── */
    const { xp, level, title: xpTitle, nextLevelXp } = xpData;
    const prevLevelXp = [0, 0, 2000, 5000, 7500, 10000, 15000][level] || 0;
    const progressPct = nextLevelXp > prevLevelXp
        ? Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100).toFixed(1)
        : 100;
    const milestones = [2000, 5000, 7500, 10000];


    /* ── stat card data ── */
    const statCards = [
        {
            label: "Total Revenue", value: stats.revenue, change: stats.revenueChange, colorToken: "green",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>,
        },
        {
            label: "Total Bids", value: stats.bids, change: stats.bidsChange, colorToken: "indigo",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8"><path d="m9 12 2 2 4-4" /><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7z" /><path d="M22 19H2" /></svg>,
        },
        {
            label: "Items Sold", value: stats.sold, change: stats.soldChange, colorToken: "amber",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" /></svg>,
        },
        {
            label: "Active Watchers", value: stats.watchers, change: null, colorToken: "pink",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
        },
    ];

    /* ── profile fields ── */
    const profileFields = !userData ? [] : [
        { label: "Email", value: userData.email },
        { label: "Mobile", value: (userData.countryCode || "") + " " + (userData.mobileNumber || "—") },
        { label: "Currency", value: userData.defaultCurrency },
        { label: "Timezone", value: userData.timezone },
        { label: "Address", value: userData.streetAddress || "—" },
        { label: "City", value: userData.city || "—" },
        { label: "Country", value: userData.country || "—" },
        { label: "Date of Birth", value: userData.dateOfBirth || "—" },
    ];

    /* ── modal rows ── */
    const modalRows = selectedAuction ? [
        { label: "Created", value: selectedAuction.createdAt ? new Date(selectedAuction.createdAt).toLocaleString() : "—" },
        {
            label: "Start Date",
            value: selectedAuction.startDate
                ? new Date(selectedAuction.startDate).toLocaleString()
                : selectedAuction.createdAt ? new Date(selectedAuction.createdAt).toLocaleString() : "—",
        },
        {
            label: "End Date",
            value: selectedAuction.endDate
                ? new Date(selectedAuction.endDate).toLocaleString()
                : selectedAuction.createdAt && selectedAuction.auctionDays
                    ? new Date(new Date(selectedAuction.createdAt).getTime() + parseInt(selectedAuction.auctionDays) * 86400000).toLocaleString()
                    : selectedAuction.createdAt && selectedAuction.endsIn
                        ? new Date(Date.now() + (selectedAuction.endsIn * 1000)).toLocaleString()
                        : "—",
        },
        { label: "Category", value: selectedAuction.category || "—" },
        { label: "Opening Bid", value: `${ selectedAuction.currency || "USD" } ${ parseFloat(selectedAuction.openBid || 0).toLocaleString() }` },
        { label: "Current Bid", value: `${ selectedAuction.currency || "USD" } ${ parseFloat(selectedAuction.currentBid || 0).toLocaleString() }` },
        { label: "Total Bids", value: selectedAuction.bidderCount || 0 },
        { label: "Status", value: selectedAuction.status === "active" ? "🟢 Live" : "⚫ Ended" },
    ] : [];

    /* ── seller prefs ── */
    const sellerPrefs = [
        {
            label: "In-app Notifications", sub: "Receive bid alerts and messages", on: true,
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
        },
        {
            label: "Automatic Renewals", sub: "Relist unsold items automatically", on: false,
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
        },
    ];

    /* ──────────────────────────────────────────────────────────────────────── */
    return (
        <div className="bm-root">

            {/* ── Topbar ─────────────────────────────────────────────────────── */}
            <div className="topbar">
                <div className="topbar__search">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <span className="topbar__search-placeholder">Search auctions, bidders, or transactions...</span>
                </div>
                <div className="topbar__right">
                    <div className="topbar__bell">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <div className="topbar__bell-dot" />
                    </div>
                    {walletAddress && (
                        <div className="topbar__wallet">
                            🔗 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </div>
                    )}
                    <button className="btn-p topbar__new-btn">
                        <span className="topbar__new-btn-icon">+</span> New Auction
                    </button>
                </div>
            </div>

            {/* ── Main ───────────────────────────────────────────────────────── */}
            <div className="main">

                {/* Profile Card */}
                {userData && (
                    <div className="card profile-card">
                        <div className="profile-card__header">
                            <div className="profile-card__avatar" style={{ overflow: 'hidden', padding: 0 }}>
                                {userData.avatar
                                    ? <img src={typeof userData.avatar === 'string' ? userData.avatar : URL.createObjectURL(userData.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    : (userData.username || "U")[0].toUpperCase()
                                }
                            </div>
                            <div>
                                <div className="profile-card__name">{userData.fullName || userData.username}</div>
                                <div className="profile-card__username">@{userData.username}</div>
                                <div className="profile-card__wallet">
                                    {walletAddress ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4) : "—"}
                                </div>
                            </div>
                        </div>

                        <div className="profile-card__grid">
                            {profileFields.map(item => (
                                <div key={item.label} className="profile-card__field">
                                    <div className="profile-card__field-label">{item.label}</div>
                                    <div className="profile-card__field-value">{item.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="profile-card__notifications">
                            {[
                                { label: "Notify Every Bid", value: userData.notifyEveryBid },
                                { label: "Notify Outbid", value: userData.notifyOutbid },
                                { label: "Alert Before End", value: userData.notifyBeforeEnd },
                            ].map(item => (
                                <div key={item.label} className="profile-card__notif-item">
                                    <div className={`profile-card__notif-dot ${ item.value ? "profile-card__notif-dot--on" : "profile-card__notif-dot--off" }`} />
                                    <span className={`profile-card__notif-label ${ item.value ? "profile-card__notif-label--on" : "profile-card__notif-label--off" }`}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Hero + Achievement ─────────────────────────────────────────── */}
                <div className="hero-row">
                    <div className="hero-card">
                        <div className="hero-card__glow" />
                        <h1 className="hero-card__title">
                            Welcome back, {userData?.fullName || userData?.username || "Julian"}! 👋
                        </h1>
                        <p className="hero-card__desc">
                            Your auctions have seen a{" "}
                            <span className="hero-card__highlight">12% increase</span>{" "}
                            in traffic today. You have 3 auctions ending within the next hour.
                        </p>
                        <div className="hero-card__chips">
                            <span className="chip">98% Seller Rating</span>
                            <span className="chip">Top Rated Plus</span>
                        </div>
                        <div className="hero-card__stats">
                            <div>
                                <div className="hero-card__stat-label">Pending Payouts</div>
                                <div className="hero-card__stat-value">{pendingPayouts}</div>
                            </div>
                            <div>
                                <div className="hero-card__stat-label">Store Views</div>
                                <div className="hero-card__stat-value">{storeViews}</div>
                            </div>
                        </div>
                    </div>

                    {/* Achievement */}
                    <div className="achievement-card">
                        <div className="achievement-card__level-badge">Lvl {level}</div>
                        <div>
                            <div className="achievement-card__eyebrow">Current Achievement</div>
                            <div className="achievement-card__title">
                                {xp === 0 ? "No activity yet" : `Level ${ level } ${ xpTitle }`}
                            </div>
                        </div>
                        <div>
                            <div className="achievement-card__progress-label">
                                Progress to Level {level + 1}
                            </div>
                            <div className="achievement-card__xp-row">
                                <div className="achievement-card__xp-value">
                                    {xp === 0 ? "0" : xp.toLocaleString()}
                                    <span className="achievement-card__xp-sep"> / </span>
                                    {nextLevelXp.toLocaleString()} XP
                                </div>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                            </div>
                            <div className="achievement-card__track">
                                {/*
                  progressPct is a genuinely dynamic JS-computed value (percentage 0–100)
                  that drives the width of the fill bar. This is the only inline style
                  retained in the entire file — it cannot be expressed as a static CSS class.
                */}
                                <div className="achievement-card__fill" style={{ width: `${ progressPct }%` }} />
                            </div>
                            <div className="achievement-card__pct-row">
                                <span className="achievement-card__pct">
                                    {xp === 0 ? "Start bidding to earn XP" : `${ progressPct }% COMPLETE`}
                                </span>
                                <span className="achievement-card__next">NEXT: {nextLevelXp.toLocaleString()} XP</span>
                            </div>
                        </div>
                        <div className="achievement-card__milestones">
                            {milestones.map(m => (
                                <div key={m} className="achievement-card__milestone">
                                    <div className={`achievement-card__milestone-bar ${ xp >= m ? "achievement-card__milestone-bar--active" : "achievement-card__milestone-bar--inactive" }`} />
                                    <span className={`achievement-card__milestone-label ${ xp >= m ? "achievement-card__milestone-label--active" : "achievement-card__milestone-label--inactive" }`}>
                                        {(m / 1000).toFixed(1)}k
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Stats grid ────────────────────────────────────────────────── */}
                <div className="stats-grid">
                    {statCards.map(s => {
                        const isDown = s.change && s.change.startsWith("-");
                        const changeClass = s.change === null
                            ? null
                            : `stat-card__change--${ isDown ? "down" : "up" }-${ s.colorToken }`;
                        return (
                            <div key={s.label} className="scard">
                                <div className="stat-card__header">
                                    <span className="stat-card__label">{s.label}</span>
                                    <div className={`stat-card__icon stat-card__icon--${ s.colorToken }`}>
                                        {s.icon}
                                    </div>
                                </div>
                                <div className="stat-card__value">{s.value}</div>
                                <div className="stat-card__change">
                                    {s.change === null
                                        ? <span className="stat-card__change--neutral">No historical data yet</span>
                                        : (
                                            <span className={changeClass}>
                                                {isDown ? "↓" : "↑"} {s.change}
                                                <span className="stat-card__change-vs"> vs last month</span>
                                            </span>
                                        )
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Charts row ───────────────────────────────────────────────── */}
                <div className="charts-row">

                    {/* Area chart */}
                    <div className="card chart-card">
                        <div className="chart-card__header">
                            <div>
                                <div className="stitle">Revenue & Engagement</div>
                                <div className="ssub">
                                    Revenue: <strong style={{ color: "#22c55e" }}>${chartData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}</strong>
                                    &nbsp;·&nbsp;
                                    Wins: <strong style={{ color: "#6366f1" }}>{chartData.reduce((s, d) => s + d.wins, 0)}</strong>
                                    &nbsp;·&nbsp;
                                    Losses: <strong style={{ color: "#ef4444" }}>{chartData.reduce((s, d) => s + d.losses, 0)}</strong>
                                </div>
                            </div>
                            <div className="chart-card__tabs">
                                {["7D", "30D"].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTab(t)}
                                        className={`chart-card__tab ${ activeTab === t ? "chart-card__tab--active" : "chart-card__tab--inactive" }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {chartData.every(d => d.revenue === 0 && d.wins === 0 && d.losses === 0) ? (
                            <div style={{
                                height: 230, display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                color: "#475569", fontSize: 13, gap: 8,
                            }}>
                                <span style={{ fontSize: 28 }}>📊</span>
                                No activity in the last {activeTab === "7D" ? "7" : "30"} days
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={230}>
                                <AreaChart data={chartData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gr-rev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gr-wins" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gr-loss" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fill: "#475569", fontSize: activeTab === "30D" ? 9 : 12, fontFamily: "'DM Sans'" }}
                                        axisLine={false} tickLine={false}
                                        interval={activeTab === "30D" ? 4 : 0}
                                    />
                                    <YAxis
                                        tick={{ fill: "#475569", fontSize: 11, fontFamily: "'DM Sans'" }}
                                        axisLine={false} tickLine={false}
                                        tickFormatter={v => `$${ (v / 1000).toFixed(0) }k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#1a1d2e", border: "1px solid #2a2d3a",
                                            borderRadius: 10, color: "#e2e8f0",
                                            fontFamily: "'DM Sans'", fontSize: 13,
                                        }}
                                        formatter={(v, name) => {
                                            if (name === "revenue") return [`$${ v.toLocaleString() }`, "Revenue"];
                                            if (name === "wins") return [v, "Wins"];
                                            if (name === "losses") return [v, "Losses"];
                                        }}
                                    />
                                    <Area type="monotone" dataKey="revenue"
                                        stroke="#22c55e" strokeWidth={2.5}
                                        fill="url(#gr-rev)" dot={false}
                                        activeDot={{ r: 5, fill: "#22c55e", strokeWidth: 0 }}
                                    />
                                    <Area type="monotone" dataKey="wins"
                                        stroke="#6366f1" strokeWidth={1.5}
                                        fill="url(#gr-wins)" dot={false}
                                        activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                                    />
                                    <Area type="monotone" dataKey="losses"
                                        stroke="#ef4444" strokeWidth={1.5}
                                        fill="url(#gr-loss)" dot={false}
                                        activeDot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}                    </div>

                    {/* Real-time bids */}
                    <div className="card bids-card">
                        <div className="stitle">Real-time Bids</div>
                        <div className="ssub">Most recent interactions on your live items</div>
                        <div className="bids-card__list">
                            {liveBids.length === 0
                                ? <div className="bids-card__empty">No live bids yet.</div>
                                : liveBids.map((b, i) => (
                                    <div key={i} className="bids-card__item">
                                        {/*
                      b.color is arbitrary per-user data from the API (e.g. "#4f46e5", "#0891b2").
                      There is no finite set of values to enumerate as CSS classes, so this
                      inline style is intentional and unavoidable.
                    */}
                                        <div className="av" style={{ background: b.color }}>{b.avatar}</div>
                                        <div className="bids-card__info">
                                            <div className="bids-card__name">{b.name}</div>
                                            <div className="bids-card__time">{b.time}</div>
                                        </div>
                                        <div className="bids-card__amount-wrap">
                                            <div className="bids-card__amount">{b.amount}</div>
                                            <span className={`badge badge--sm ${ b.status === "leading" ? "leading-b" : "outbid-b" }`}>
                                                {b.status === "leading" ? "Leading" : "Outbid"}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                        <div className="bids-card__footer">
                            <a>View All Activity →</a>
                        </div>
                    </div>
                </div>

                {/* ── Bottom row ───────────────────────────────────────────────── */}
                <div className="bottom-row">

                    {/* Your Auctions */}
                    <div className="card auctions-card">
                        <div className="auctions-card__header">
                            <div className="stitle">Your Auctions</div>
                            <span className="auctions-card__subtitle">Auctions you created</span>
                        </div>
                        {myAuctions.length === 0
                            ? <div className="auctions-card__empty">No auctions created yet.</div>
                            : myAuctions.map((a, i) => (
                                <div
                                    key={i}
                                    className={`auctions-card__item ${ i < myAuctions.length - 1 ? "auctions-card__item--bordered" : "" }`}
                                >
                                    <img
                                        src={a.imageUrl || a.image || "https://via.placeholder.com/38"}
                                        alt={a.title}
                                        className="simg"
                                    />
                                    <div className="auction-item__info">
                                        <div className="auction-item__title">{a.title || a.headline}</div>
                                        <div className="auction-item__date">
                                            Created: {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}
                                        </div>
                                    </div>
                                    <div className="auction-item__pricing">
                                        <div className="auction-item__bid">
                                            {a.currency || "USD"} {parseFloat(a.currentBid || a.openBid || 0).toLocaleString()}
                                        </div>
                                        <div className={`auction-item__status ${ a.status === "active" ? "auction-item__status--live" : "auction-item__status--ended" }`}>
                                            {a.status === "active" ? "● Live" : "○ Ended"}
                                        </div>
                                    </div>
                                    <div className="auction-item__actions">
                                        <button className="btn-details" onClick={() => setSelectedAuction(a)}>Details →</button>
                                        <button className="btn-delete" onClick={e => handleDeleteAuction(a._id, e)}>🗑</button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    {/* Seller Preferences */}
                </div>
            </div>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <div className="footer">
                <div className="footer__links">
                    {["Privacy Policy", "Seller Protection", "Fees & Rates"].map(l => (
                        <span key={l} className="footer__link">{l}</span>
                    ))}
                </div>
                <span className="footer__copy">© 2024 AUCTIONPRO ENTERPRISE. ALL RIGHTS RESERVED.</span>
            </div>

            {/* ── Auction Detail Modal ────────────────────────────────────────── */}
            {selectedAuction && (
                <div className="modal-overlay" onClick={() => setSelectedAuction(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-content__header">
                            <div className="modal-content__title">
                                {selectedAuction.title || selectedAuction.headline}
                            </div>
                            <button className="modal-content__close" onClick={() => setSelectedAuction(null)}>×</button>
                        </div>
                        {modalRows.map(({ label, value }) => (
                            <div key={label} className="modal-content__row">
                                <span className="modal-content__row-label">{label}</span>
                                <span className="modal-content__row-value">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Hamburger FAB ──────────────────────────────────────────────── */}
            <HamburgerFab onNavigate={onNavigate} />
        </div>
    );
}