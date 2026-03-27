import { useState, useEffect } from "react";
import SharedHeader from "./SharedHeader";
import { getAuctions, getWallet, getMe } from "./api";
import { shortAddress } from "./blockchain";
import "./Dashboard.css";

/* ─── FAB ────────────────────────────────────────────────────── */
const fabItems = [
  { label: "Dashboard", page: "dashboard", icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></> },
  { label: "Auction Lobby", page: "lobby", icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></> },
  { label: "Auction History", page: "history", icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
  { label: "Profile", page: "profile", icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
];

function HamburgerFab({ onNavigate }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`fab-wrap ${ open ? "open" : "" }`}>
      <div className="fab-items">
        {fabItems.map((item, i) => (
          <button key={i} className="fab-item" data-tooltip={item.label}
            onClick={() => { onNavigate(item.page); setOpen(false); }}>
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

/* ─── Profile Card ───────────────────────────────────────────── */
function ProfileCard({ userData, walletAddress, chainProfile }) {
  const name = userData?.fullName || userData?.username || chainProfile?.username || shortAddress(walletAddress);
  const avatarLetter = (userData?.username || userData?.fullName || chainProfile?.username || "?")[0].toUpperCase();
  const email = userData?.email || "—";
  const currency = userData?.defaultCurrency || chainProfile?.defaultCurrency || "ETH";
  const totalBids = chainProfile?.totalBidsPlaced ?? 0;
  const totalWon = chainProfile?.totalAuctionsWon ?? 0;
  const totalCreated = chainProfile?.totalAuctionsCreated ?? 0;

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          {userData?.avatar
            ? <img src={typeof userData.avatar === 'string' ? userData.avatar : URL.createObjectURL(userData.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : avatarLetter
          }
        </div>
        <div>
          <div className="profile-name">{name}</div>
          <div className="profile-email">{email}</div>
          <div className="profile-wallet">🔗 {shortAddress(walletAddress)}</div>
        </div>
        <div className="profile-currency-badge">{currency}</div>
      </div>
      <div className="profile-stats">
        {[
          { label: "Total Bids", value: totalBids, color: "#6366f1" },
          { label: "Auctions Won", value: totalWon, color: "#22c55e" },
          { label: "Items Listed", value: totalCreated, color: "#f59e0b" },
        ].map(stat => (
          <div key={stat.label} className="profile-stat">
            <div className="profile-stat-val" style={{ color: stat.color }}>{stat.value}</div>
            <div className="profile-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Wallet Card ────────────────────────────────────────────── */
function WalletCard({ walletData }) {
  if (!walletData) return null;
  return (
    <div className="wallet-card">
      <div className="wallet-title">💰 Wallet Balance</div>
      <div className="wallet-balance">{walletData.balance || "0.0000"} ETH</div>
      {walletData.pendingWithdrawal && parseFloat(walletData.pendingWithdrawal) > 0 && (
        <div className="wallet-pending">
          <span>Pending: <strong className="wallet-pending-amount">{walletData.pendingWithdrawal} ETH</strong></span>
          <button className="wallet-withdraw-btn">Withdraw</button>
        </div>
      )}
    </div>
  );
}

/* ─── Auction Card ───────────────────────────────────────────── */
function AuctionCard({ item, idx, wishlist, toggleWish, onNavigate }) {
  const placeholderImg = "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&q=80";
  const imgSrc = item.imageUrl || item.img || placeholderImg;
  const title = item.title || item.headline || "Untitled";

  const formatEnds = (endsIn) => {
    if (!endsIn || endsIn <= 0) return "Ended";
    const h = Math.floor(endsIn / 3600);
    const m = Math.floor((endsIn % 3600) / 60);
    if (h > 24) return `${ Math.floor(h / 24) }d ${ h % 24 }h`;
    if (h > 0) return `${ h }h ${ m }m`;
    return `${ m }m`;
  };

  const formatBid = (bid, currency) => {
    if (!bid && bid !== 0) return "—";
    const num = parseFloat(bid);
    if (isNaN(num)) return "—";
    const symbols = { ETH: "Ξ", BTC: "₿", USD: "$", EUR: "€", GBP: "£", INR: "₹", AED: "د.إ" };
    const sym = symbols[currency] || "$";
    if (currency === "ETH" || currency === "BTC") return `${ sym } ${ num }`;
    return sym + num.toLocaleString();
  };

  return (
    <div className="listing-card">
      <div className="listing-img-wrap">
        <img src={imgSrc} alt={title} className="listing-img"
          onError={e => { e.target.src = placeholderImg; }} />
        <span className="card-category-badge">{item.category || item.tag || "—"}</span>
        <button
          className={`card-wish-btn ${ wishlist[idx] ? "active" : "inactive" }`}
          onClick={() => toggleWish(idx)}>
          {wishlist[idx] ? "❤️" : "♡"}
        </button>
        {(() => {
          const now = new Date();
          const endDate = item.endDate ? new Date(item.endDate) : null;
          const startDate = item.startDate ? new Date(item.startDate) : null;
          const isEnded = !endDate || endDate <= now || item.status === "ended";
          const isSoon = !isEnded && startDate && startDate > now;
          if (isEnded) return <span className="card-live-badge" style={{ background: "#555" }}>● ENDED</span>;
          if (isSoon) return <span className="card-live-badge" style={{ background: "#f59e0b" }}>● SOON</span>;
          return <span className="card-live-badge">● LIVE</span>;
        })()}
      </div>
      <div className="card-body">
        <div className="card-title">{title}</div>
        <div className="card-ends">🕐 Ends in: {formatEnds(item.endsIn)}</div>
        <div className="card-bottom">
          <div>
            <div className="card-bid-label">Current Bid</div>
            <div className="card-bid-val">
              {item.currentBid !== undefined
                ? formatBid(item.currentBid, item.currency)
                : item.price || "—"
              }
            </div>
          </div>
          <div className="card-bids-pill">
            <span className="live-dot" style={{ marginRight: 4 }} />
            {item.bidders ?? item.bids ?? 0} bids
          </div>
        </div>
        <button className="bid-btn" onClick={() => onNavigate && onNavigate("lobby")}>
          Bid Now
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════ */
export default function BidMasterDashboard({ onNavigate, walletAddress, userData, initialTab }) {
  const [activeView, setActiveView] = useState("grid");
  const [wishlist, setWishlist] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [conditions, setConditions] = useState({ "Brand New": false, Mint: false, Excellent: false, Fair: false });
  const [times, setTimes] = useState({ "Ending Soon (<1h)": false, "Ending Today": false, Upcoming: false });

  const [listings, setListings] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [chainProfile, setChainProfile] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const toggleWish = idx => setWishlist(w => ({ ...w, [idx]: !w[idx] }));
  const totalPages = Math.ceil(listings.length / itemsPerPage);
  const paginatedListings = listings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const activeFilterCount = Object.values(conditions).filter(Boolean).length + Object.values(times).filter(Boolean).length;

  const clearAll = () => {
    setConditions({ "Brand New": false, Mint: false, Excellent: false, Fair: false });
    setTimes({ "Ending Soon (<1h)": false, "Ending Today": false, Upcoming: false });
  };

  useEffect(() => {
    if (!walletAddress) { setLoadingData(false); return; }

    (async () => {
      try {
        const { ethers } = await import('ethers');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(walletAddress);
        const formatted = parseFloat(ethers.formatEther(balance)).toFixed(4);
        setWalletData({ balance: formatted });
      } catch (err) {
        console.warn("Balance fetch failed:", err.message);
      }

      getMe()
        .then(({ user }) => {
          if (user) setChainProfile({
            username: user.username || "",
            defaultCurrency: user.defaultCurrency || "ETH",
            totalBidsPlaced: user.totalBids || 0,
            totalAuctionsWon: user.totalWon || 0,
            totalAuctionsCreated: user.totalCreated || 0,
          });
        })
        .catch(err => console.warn("Profile fetch failed:", err.message));

      getAuctions()
        .then(({ auctions }) => {
          if (auctions?.length > 0) {
            setListings(auctions.map(a => ({
              _id: a._id, mongoId: a._id,
              title: a.title || a.headline || "Untitled",
              headline: a.title || a.headline || "Untitled",
              category: a.category || "Collectibles",
              tag: a.category || "Collectibles",
              currency: a.currency || "USD",
              currentBid: parseFloat(a.currentBid || a.openBid || 0),
              price: a.currentBid ? `${ a.currency === "ETH" ? "Ξ" : "$" }${ a.currentBid }` : "—",
              bidders: a.bidderCount || 0,
              bids: a.bidderCount || 0,
              endsIn: a.endDate ? Math.max(0, Math.floor((new Date(a.endDate) - new Date()) / 1000)) : (a.endsIn || 0),
              ends: a.endDate ? `${ Math.floor(Math.max(0, (new Date(a.endDate) - new Date()) / 1000) / 3600) }h` : (a.endsIn ? `${ Math.floor(a.endsIn / 3600) }h` : "—"),
              endDate: a.endDate || null,
              startDate: a.startDate || null,
              status: (a.endDate && new Date(a.endDate) <= new Date()) ? "ended" : (a.status || "active"),
              imageUrl: a.imageUrl || "",
              img: a.imageUrl || "",
              images: a.images || [],
              description: a.description || "",
              grade: a.grade || "",
            })));
          } else {
            setListings([]);
          }
        })
        .catch(err => {
          console.warn("My auctions fetch failed:", err.message);
          setListings([]);
        });

      setLoadingData(false);
    })();
  }, [walletAddress]);

  const placeholderImg = "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&q=80";

  return (
    <div className="app">
      <SharedHeader walletAddress={walletAddress} onNewAuction={() => onNavigate("lobby")} onNavigate={onNavigate} />
      <div className={`filter-overlay ${ filtersOpen ? "open" : "" }`} onClick={() => setFiltersOpen(false)} />

      {/* Filter Drawer */}
      <div className={`filter-drawer ${ filtersOpen ? "open" : "" }`}>
        <div className="drawer-header">
          <div className="drawer-header-title">
            🎛 Filters
            {activeFilterCount > 0 && <span className="drawer-count-badge">{activeFilterCount}</span>}
          </div>
          <button className="drawer-close-btn" onClick={() => setFiltersOpen(false)}>✕</button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-section-label">Item Condition</div>
            {Object.keys(conditions).map(c => (
              <label key={c} className="drawer-check-label">
                <input type="checkbox" checked={conditions[c]}
                  onChange={() => setConditions(p => ({ ...p, [c]: !p[c] }))}
                  style={{ accentColor: "var(--accent)" }} /> {c}
              </label>
            ))}
          </div>
          <div className="drawer-section">
            <div className="drawer-section-label">Time Left</div>
            {Object.keys(times).map(c => (
              <label key={c} className="drawer-check-label">
                <input type="checkbox" checked={times[c]}
                  onChange={() => setTimes(p => ({ ...p, [c]: !p[c] }))}
                  style={{ accentColor: "var(--accent)" }} /> {c}
              </label>
            ))}
          </div>
        </div>
        <div className="drawer-footer">
          <button className="clear-btn" onClick={clearAll}>Clear All</button>
          <button className="apply-btn" onClick={() => setFiltersOpen(false)}>Apply Filters</button>
        </div>
      </div>

      <div className="app-body">
        <main className="main">

          {/* Profile Card */}
          {(userData || chainProfile) && (
            <ProfileCard userData={userData} walletAddress={walletAddress} chainProfile={chainProfile} />
          )}

          {/* Wallet Card */}
          {walletData && <WalletCard walletData={walletData} />}

          {/* Loading */}
          {loadingData && (
            <div className="loading-row">
              <div className="loading-spinner" />
              Loading your dashboard…
            </div>
          )}

          {/* Header */}
          <div className="breadcrumb">
            Marketplace / <span className="breadcrumb-current">Live Auctions</span>
          </div>
          <div className="page-top">
            <h1 className="page-title">Live Auctions</h1>
            <span className="items-badge">{listings.length} Items</span>
            <div className="page-top-right">
              <button className="filter-btn" onClick={() => setFiltersOpen(v => !v)}>
                ⚙ Filters
                {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
              </button>
              <div className="view-toggle">
                <button className={`page-btn view-toggle-btn ${ activeView === "grid" ? "active" : "" }`}
                  onClick={() => setActiveView("grid")}>⊞ Grid</button>
                <button className={`page-btn view-toggle-btn ${ activeView === "list" ? "active" : "" }`}
                  onClick={() => setActiveView("list")}>≡ List</button>
              </div>
            </div>
          </div>

          {/* Listings header */}
          <div className="listings-header">
            <div className="listings-title">Active Listings</div>
            <div className="sort-row">
              Sort by:
              <select className="sort-select">
                <option>Highest Bid</option>
                <option>Ending Soon</option>
                <option>Most Bids</option>
                <option>Newest</option>
              </select>
            </div>
          </div>

          {/* Empty state */}
          {listings.length === 0 && !loadingData && (
            <div className="empty-state">
              <div className="empty-icon">🔨</div>
              <div className="empty-title">No auctions yet</div>
              <div className="empty-sub">Create your first listing from the Auction Lobby.</div>
              <button className="empty-btn" onClick={() => onNavigate("lobby")}>Go to Lobby →</button>
            </div>
          )}

          {/* Grid view */}
          {activeView === "grid" && listings.length > 0 && (
            <div className="grid-view">
              {paginatedListings.map((item, i) => (
                <AuctionCard key={item._id || i} item={item} idx={i}
                  wishlist={wishlist} toggleWish={toggleWish} onNavigate={onNavigate} />
              ))}
            </div>
          )}

          {/* List view */}
          {activeView === "list" && listings.length > 0 && (
            <div className="list-view">
              {paginatedListings.map((item, i) => {
                const imgSrc = item.imageUrl || item.img || placeholderImg;
                const title = item.title || item.headline || "Untitled";
                return (
                  <div key={item._id || i} className="list-item">
                    <img src={imgSrc} alt={title} className="list-item-img"
                      onError={e => { e.target.src = placeholderImg; }} />
                    <div className="list-item-body">
                      <div className="list-item-title">{title}</div>
                      <div className="list-item-meta">
                        <span className="list-category-pill">{item.category || "—"}</span>
                        <span>🕐 {item.ends || "—"}</span>
                        <span><span className="live-dot" style={{ marginRight: 4 }} />{item.bidders ?? 0} bids live</span>
                      </div>
                    </div>
                    <div className="list-item-right">
                      <div>
                        <div className="list-bid-label">Current Bid</div>
                        <div className="list-bid-val">{item.price || "—"}</div>
                      </div>
                      <button className="list-bid-btn" onClick={() => onNavigate("lobby")}>Bid Now</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} className={`page-btn ${ currentPage === n ? "active" : "" }`}
                  onClick={() => setCurrentPage(n)}>{n}</button>
              ))}
              <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next →</button>
            </div>
          )}
        </main>
      </div>

      <footer className="footer">
        <span>© 2026 AuctionHub Inc.</span>
        <div className="footer-links">
          {["Privacy Policy", "Terms of Service", "Safety Center"].map(l => (
            <span key={l} className="footer-link">{l}</span>
          ))}
        </div>
        <div className="footer-status">
          <div className="footer-status-dot" />
          System Status: Optimal · v2.4.0
        </div>
      </footer>

      <HamburgerFab onNavigate={onNavigate} />
    </div>
  );
}