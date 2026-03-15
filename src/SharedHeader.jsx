import { useState } from "react";

const searchableItems = [
    { label: "Dashboard", page: "dashboard", type: "Page" },
    { label: "Auction Lobby", page: "lobby", type: "Page" },
    { label: "Auction History", page: "history", type: "Page" },
    { label: "Profile", page: "profile", type: "Page" },
    { label: "Live Auctions", page: "lobby", type: "Section" },
    { label: "Bid History", page: "history", type: "Section" },
    { label: "Sales History", page: "dashboard", type: "Section" },
    { label: "Seller Preferences", page: "dashboard", type: "Section" },
    { label: "Wallet", page: "profile", type: "Section" },
];

export default function SharedHeader({ walletAddress, onNewAuction, onNavigate }) {
    const [query, setQuery] = useState("");
    const [focused, setFocused] = useState(false);

    const results = query.trim().length > 0
        ? searchableItems.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase())
        )
        : [];

    const handleSelect = (page) => {
        setQuery("");
        setFocused(false);
        if (onNavigate) onNavigate(page);
    };

    return (
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

            {/* Search */}
            <div style={{ flex: 1, maxWidth: 480, position: "relative" }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "#13161e", border: `1px solid ${ focused ? "#6366f1" : "#1e2130" }`,
                    borderRadius: 9, padding: "9px 16px", transition: "border-color 0.2s"
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setTimeout(() => setFocused(false), 150)}
                        placeholder="Search auctions, bidders, or transactions..."
                        style={{
                            background: "none", border: "none", outline: "none",
                            color: "#e2e8f0", fontSize: 13, width: "100%", fontFamily: "inherit"
                        }}
                    />
                    {query && (
                        <span onClick={() => setQuery("")} style={{ color: "#475569", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</span>
                    )}
                </div>

                {/* Dropdown results */}
                {focused && results.length > 0 && (
                    <div style={{
                        position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                        background: "#13161e", border: "1px solid #1e2130", borderRadius: 10,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 999, overflow: "hidden"
                    }}>
                        {results.map((item, i) => (
                            <div key={i} onMouseDown={() => handleSelect(item.page)}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "10px 16px", cursor: "pointer", borderBottom: i < results.length - 1 ? "1px solid #1a1d27" : "none",
                                    transition: "background 0.15s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#1e2130"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                    </svg>
                                    <span style={{ color: "#e2e8f0", fontSize: 13 }}>{item.label}</span>
                                </div>
                                <span style={{
                                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                                    background: "rgba(99,102,241,0.15)", color: "#a5b4fc"
                                }}>{item.type}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* No results */}
                {focused && query.trim().length > 0 && results.length === 0 && (
                    <div style={{
                        position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                        background: "#13161e", border: "1px solid #1e2130", borderRadius: 10,
                        padding: "14px 16px", color: "#475569", fontSize: 13,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 999
                    }}>
                        No results found for "<span style={{ color: "#e2e8f0" }}>{query}</span>"
                    </div>
                )}
            </div>

            {/* Right side */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ position: "relative", cursor: "pointer" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #0a0c10" }} />
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
    );
}