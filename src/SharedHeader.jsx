import { useState } from "react";

export default function SharedHeader({ walletAddress, onNewAuction, onNavigate }) {
    const [bellOpen, setBellOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
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

    return (
        <>
            <style>{`
                @keyframes shFadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .sh-notif-item:hover { background: #1e2130; }
                .sh-bell-btn:hover { background: #13161e; }
            `}</style>

            <div style={{
                background: "#0a0c10",
                borderBottom: "1px solid #1a1d27",
                padding: "11px 32px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                position: "sticky",
                top: 0,
                zIndex: 200,
                fontFamily: "'DM Sans', sans-serif"
            }}>
                {/* Right side */}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>

                    {/* Bell */}
                    <div style={{ position: "relative" }}>
                        <div
                            className="sh-bell-btn"
                            onClick={handleBellClick}
                            style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, transition: "background 0.15s" }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {hasUnread && notifications.some(n => !n.read) && (
                                <div style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #0a0c10" }} />
                            )}
                        </div>

                        {bellOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    style={{ position: "fixed", inset: 0, zIndex: 299 }}
                                    onClick={() => setBellOpen(false)}
                                />
                                {/* Dropdown */}
                                <div style={{
                                    position: "absolute",
                                    top: "calc(100% + 10px)",
                                    right: 0,
                                    width: 300,
                                    background: "#13161e",
                                    border: "1px solid #1e2130",
                                    borderRadius: 12,
                                    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                                    zIndex: 300,
                                    overflow: "hidden",
                                    animation: "shFadeIn 0.18s ease",
                                }}>
                                    {/* Header */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #1e2130" }}>
                                        <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>Notifications</span>
                                        <span
                                            onClick={markAllRead}
                                            style={{ color: notifications.every(n => n.read) ? "#475569" : "#6366f1", fontSize: 11, cursor: notifications.every(n => n.read) ? "default" : "pointer", transition: "color 0.15s" }}
                                        >
                                            {notifications.every(n => n.read) ? "All read" : "Mark all read"}
                                        </span>
                                    </div>

                                    {/* Items */}
                                    {notifications.map((n, i) => (
                                        <div
                                            key={i}
                                            className="sh-notif-item"
                                            onClick={() => markOneRead(i)}
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 10,
                                                padding: "12px 16px",
                                                borderBottom: i < notifications.length - 1 ? "1px solid #1a1d27" : "none",
                                                cursor: "pointer",
                                                transition: "background 0.15s",
                                                background: n.read ? "transparent" : "rgba(99,102,241,0.05)",
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: n.read ? "#94a3b8" : "#e2e8f0", fontSize: 12, marginBottom: 3, lineHeight: 1.4 }}>{n.text}</div>
                                                <div style={{ color: "#475569", fontSize: 11 }}>{n.time}</div>
                                            </div>
                                            {/* Purple dot only shows if unread */}
                                            {!n.read && (
                                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", marginTop: 4, flexShrink: 0 }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {walletAddress && (
                        <div style={{ background: "#13161e", border: "1px solid #1e2130", borderRadius: 8, padding: "6px 14px", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#a5b4fc" }}>
                            🔗 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </div>
                    )}

                    <button onClick={onNewAuction} style={{ background: "#6366f1", color: "white", border: "none", padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Auction
                    </button>
                </div>
            </div>
        </>
    );
}