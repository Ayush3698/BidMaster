import { useState } from "react";

export default function SharedHeader({ walletAddress, onNewAuction, onNavigate }) {
    const [bellOpen, setBellOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const [activePage, setActivePage] = useState(null);
    const [notifications, setNotifications] = useState([
        { text: "Payment received for your auction", time: "2m ago", read: false },
        { text: "You won an auction!", time: "1h ago", read: false },
        { text: "Your auction was outbid", time: "3h ago", read: false },
        { text: "Auction successfully published", time: "5h ago", read: false },
        { text: "Item marked as delivered", time: "1d ago", read: false },
    ]);

    const handleBellClick = () => {
        setBellOpen(v => !v);
        setHasUnread(false);
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markOneRead = (i) => {
        setNotifications(prev => prev.map((n, idx) => idx === i ? { ...n, read: true } : n));
    };

    const navLinks = [
        { key: "auctions", label: "Auctions", icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/>
            </svg>
        )},
        { key: "watchlist", label: "Watchlist", icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
        )},
        { key: "mybids", label: "My Bids", icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
        )},
        { key: "consign", label: "Consign", icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7-7 7 7"/>
            </svg>
        )},
    ];

    const handleNav = (key) => {
        setActivePage(key);
        if (onNavigate) onNavigate(key);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');

                @keyframes shFadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes logoPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
                    50% { box-shadow: 0 0 0 6px rgba(124,58,237,0); }
                }
                .sh-notif-item:hover { background: #1e2130 !important; }
                .sh-bell-btn:hover { background: #13161e !important; }
                .sh-nav-link {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 13px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    background: transparent;
                    font-family: 'Inter', sans-serif;
                    transition: background 0.15s, color 0.15s;
                    position: relative;
                    white-space: nowrap;
                    letter-spacing: 0.01em;
                }
                .sh-nav-link.inactive {
                    color: #64748b;
                }
                .sh-nav-link.inactive:hover {
                    color: #94a3b8;
                    background: rgba(255,255,255,0.04);
                }
                .sh-new-btn:hover {
                    background: #5b5cf6 !important;
                    box-shadow: 0 4px 16px rgba(99,102,241,0.4) !important;
                    transform: translateY(-1px);
                }
                .sh-new-btn {
                    transition: all 0.2s !important;
                }
                .sh-divider {
                    width: 1px;
                    height: 20px;
                    background: #1e2130;
                    flex-shrink: 0;
                }
            `}</style>

            <div style={{
                background: "rgba(10, 10, 15, 0.92)",
                borderBottom: "1px solid #1a1a2e",
                padding: "0 28px",
                display: "flex",
                alignItems: "center",
                gap: 0,
                position: "sticky",
                top: 0,
                zIndex: 200,
                fontFamily: "'Inter', sans-serif",
                height: 58,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
            }}>

                
                {/* ── Right side ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: "auto" }}>

                    {/* Bell */}
                    <div style={{ position: "relative" }}>
                        <div
                            className="sh-bell-btn"
                            onClick={handleBellClick}
                            style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, transition: "background 0.15s" }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                            {hasUnread && notifications.some(n => !n.read) && (
                                <div style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", border: "2px solid #0a0a0f" }} />
                            )}
                        </div>

                        {bellOpen && (
                            <>
                                <div style={{ position: "fixed", inset: 0, zIndex: 299 }} onClick={() => setBellOpen(false)} />
                                <div style={{
                                    position: "absolute",
                                    top: "calc(100% + 10px)",
                                    right: 0,
                                    width: 300,
                                    background: "#111118",
                                    border: "1px solid #1e1e2e",
                                    borderRadius: 12,
                                    boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
                                    zIndex: 300,
                                    overflow: "hidden",
                                    animation: "shFadeIn 0.18s ease",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #1e1e2e" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ color: "#f0f0ff", fontSize: 13, fontWeight: 700 }}>Notifications</span>
                                            {notifications.some(n => !n.read) && (
                                                <span style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>
                                                    {notifications.filter(n => !n.read).length} new
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            onClick={markAllRead}
                                            style={{ color: notifications.every(n => n.read) ? "#334155" : "#7c3aed", fontSize: 11, fontWeight: 600, cursor: notifications.every(n => n.read) ? "default" : "pointer" }}
                                        >
                                            {notifications.every(n => n.read) ? "All read" : "Mark all read"}
                                        </span>
                                    </div>

                                    {notifications.map((n, i) => (
                                        <div
                                            key={i}
                                            className="sh-notif-item"
                                            onClick={() => markOneRead(i)}
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 10,
                                                padding: "11px 16px",
                                                borderBottom: i < notifications.length - 1 ? "1px solid #17171f" : "none",
                                                cursor: "pointer",
                                                transition: "background 0.15s",
                                                background: n.read ? "transparent" : "rgba(124,58,237,0.05)",
                                            }}
                                        >
                                            {/* Icon per notification type */}
                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: n.read ? "#17171f" : "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                                <span style={{ fontSize: 13 }}>
                                                    {n.text.includes("Payment") ? "💳" : n.text.includes("won") ? "🏆" : n.text.includes("outbid") ? "📈" : n.text.includes("published") ? "✅" : "📦"}
                                                </span>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: n.read ? "#64748b" : "#e2e8f0", fontSize: 12, marginBottom: 3, lineHeight: 1.45 }}>{n.text}</div>
                                                <div style={{ color: "#334155", fontSize: 11 }}>{n.time}</div>
                                            </div>
                                            {!n.read && (
                                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", marginTop: 6, flexShrink: 0 }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="sh-divider" />

                    {/* Wallet */}
                    {walletAddress && (
                        <div style={{
                            background: "rgba(124,58,237,0.08)",
                            border: "1px solid rgba(124,58,237,0.25)",
                            borderRadius: 8,
                            padding: "5px 12px",
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 11,
                            color: "#a78bfa",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </div>
                    )}

                    {/* New Auction */}
                    <button
                        className="sh-new-btn"
                        onClick={onNewAuction}
                        style={{
                            background: "#7c3aed",
                            color: "white",
                            border: "none",
                            padding: "8px 18px",
                            borderRadius: 9,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            boxShadow: "0 2px 10px rgba(124,58,237,0.3)",
                            letterSpacing: "0.01em",
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        New Auction
                    </button>
                </div>
            </div>
        </>
    );
}