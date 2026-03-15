import { useState, useEffect } from "react";
import { getMyBids, submitComplaint, getAuction } from "./api";
import { fetchUserHistory, fetchAuction, shortAddress } from "./blockchain";
import "./AuctionHistory.css";

/* ─── Hamburger FAB ────────────────────────────────────────── */
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

/* ─── Complaint Modal ──────────────────────────────────────── */
function ComplaintModal({ item, onClose, walletAddress }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleDrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFileName(f.name); };
  const handleFileChange = (e) => { const f = e.target.files[0]; if (f) setFileName(f.name); };

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await submitComplaint({ auctionId: item.id, auctionTitle: item.title, reason, description, walletAddress });
    } catch (err) {
      console.warn("Complaint API failed (non-blocking):", err.message);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  if (submitted) return (
    <div className="modal-overlay">
      <div className="modal-success-box">
        <div className="modal-success-icon">✓</div>
        <div className="modal-success-title">Complaint Submitted</div>
        <div className="modal-success-sub">Our compliance team will review within 24 hours.</div>
        <button className="modal-success-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        <div className="modal-header">
          <div className="modal-warn-icon">⚠</div>
          <div>
            <div className="modal-header-title">Report an Issue</div>
            <div className="modal-header-sub">Filing a complaint for: <strong>{item.title}</strong></div>
          </div>
        </div>
        <div className="modal-field">
          <label className="modal-label">Reason for Complaint</label>
          <input className="modal-input" value={reason} onChange={e => setReason(e.target.value)}
            placeholder="e.g. Item not as described, fraud, shipping issue..." />
        </div>
        <div className="modal-field">
          <label className="modal-label">Detailed Description</label>
          <textarea className="modal-textarea" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Please provide as much detail as possible..." rows={5} />
        </div>
        <div className="modal-dropzone"
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}
          onClick={() => document.getElementById("complaint-file").click()}>
          <input id="complaint-file" type="file" accept=".png,.jpg,.jpeg,.pdf" style={{ display: "none" }} onChange={handleFileChange} />
          <div className="modal-dropzone-icon">📎</div>
          {fileName
            ? <div className="modal-dropzone-success">✓ {fileName}</div>
            : <div className="modal-dropzone-hint"><span>Click to upload</span> or drag and drop</div>
          }
        </div>
        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className={`modal-submit-btn ${ reason.trim() && !submitting ? "active" : "disabled" }`}
            onClick={handleSubmit} disabled={!reason.trim() || submitting}>
            {submitting ? "Submitting…" : "Submit Formal Complaint"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Map API/chain data → display row ──────────────────────── */
function normalizeAuctionRow(item, walletAddress) {
  const addr = (walletAddress || "").toLowerCase();
  const winner = (item.winner || item.highestBidder || "").toLowerCase();
  const ended = item.ended || item.status === "closed" || item.status === "ended" || item.status === "lost" || item.status === "won";

  let status = "bid";
  if (ended && winner && winner === addr) status = "won";
  else if (ended) status = "lost";

  const img = item.imageUrl || item.images?.[0] || item.image || item.img || "";

  return {
    id: item._id || item.id || item.auctionId || "—",
    title: item.title || item.headline || "Unknown Item",
    subtitle: item.category || "—",
    category: item.category || "—",
    date: new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: item.time || "—",
    finalAmount: item.currentBid || item.amount || item.openBid || "—",
    currentBid: item.currentBid || item.amount || item.openBid || "—",
    status,
    statusLabel: status === "won" ? "Won" : status === "lost" ? "Lost" : "Bid",
    subStatus: status === "won" ? "Completed" : status === "lost" ? "Outbid" : "In Progress",
    bidders: item.bidderCount || 0,
    img,
    thumbs: item.images?.length ? item.images : (img ? [img] : []),
    timer: ended ? "Ended" : "Active",
    bids: item.bids || [],
    description: item.description || null,
    openBid: item.openBid || "—",
    reserve: item.reserve || "—",
    buyNow: item.buyNow || "—",
    grade: item.grade || "—",
    currency: item.currency || "USD",
    noReserve: item.noReserve ? "Yes" : "No",
    auctionDays: item.auctionDays || "—",
    startDate: new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    endDate: item.endsAt ? new Date(item.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
  };
}

/* ─── ProductDetail ──────────────────────────────────────────── */
function ProductDetail({ item, onBack, walletAddress }) {
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [complaintOpen, setComplaintOpen] = useState(false);

  const bidStatusClass = `pd-bid-status-${ item.status }`;

  return (
    <div>
      {complaintOpen && <ComplaintModal item={item} onClose={() => setComplaintOpen(false)} walletAddress={walletAddress} />}

      <div className="pd-breadcrumb-wrap">
        <div className="pd-breadcrumb">
          <span className="pd-back-link" onClick={onBack}>← Back</span>
        </div>
      </div>

      <div className="pd-body">
        <div className="pd-top-grid">

          {/* Left: images */}
          <div>
            <div className="pd-image-box">
              {item.img
                ? <img className="pd-main-img" src={item.thumbs?.[selectedThumb] || item.img} alt={item.title} />
                : <div className="pd-no-img">No image available</div>
              }
            </div>
            <div className="pd-thumbs">
              {(item.thumbs?.length ? item.thumbs : [item.img]).filter(Boolean).map((t, i) => (
                <div key={i} className={`pd-thumb ${ selectedThumb === i ? "active" : "inactive" }`}
                  onClick={() => setSelectedThumb(i)}>
                  <img src={t} alt="" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: info */}
          <div>
            <h1 className="pd-title">{item.title}</h1>
            <p className="pd-subtitle">{item.subtitle}</p>

            <div className="pd-bid-card">
              <div className="pd-bid-top">
                <div>
                  <div className="pd-bid-label">Final / Current Bid</div>
                  <div className="pd-bid-amount">{item.currentBid || item.finalAmount}</div>
                </div>
                <div>
                  <div className="pd-bid-status-label">Status</div>
                  <div className={bidStatusClass}>
                    {item.timer === "Ended" ? (item.status === "won" ? "🏆 Won" : "❌ Ended") : "🔴 Active"}
                  </div>
                </div>
              </div>
              <div className="pd-status-row">
                <span className={`pd-status-badge status-${ item.status }`}>{item.statusLabel}</span>
                <span className="pd-sub-status">• {item.subStatus}</span>
              </div>
              <div className="pd-meta-grid">
                {[
                  { label: "Auction Date", value: item.date },
                  { label: "Listed On", value: item.listedOn },
                  { label: "Total Bidders", value: item.bidders || "—" },
                  { label: "Category", value: item.category },
                ].map(({ label, value }) => (
                  <div key={label} className="pd-meta-cell">
                    <div className="pd-meta-label">{label}</div>
                    <div className="pd-meta-value">{value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pd-action-row">
              <button className="pd-report-btn" onClick={() => setComplaintOpen(true)}>⚑ Report Issue</button>
            </div>
          </div>
        </div>

        {/* Description */}
        {item.description && item.description !== "No description available." && (
          <div className="pd-section">
            <div className="pd-section-title">Description</div>
            <p className="pd-desc">{item.description}</p>
          </div>
        )}

        {/* Specifications */}
        <div className="pd-specs-grid">
          <div className="pd-specs-box">
            <div className="pd-specs-title">Specifications</div>
            <div className="pd-specs-list">
              {[
                { label: "Opening Bid", value: item.openBid },
                { label: "Reserve Price", value: item.noReserve === "Yes" ? "No Reserve" : item.reserve },
                { label: "Buy Now Price", value: item.buyNow },
                { label: "Start Date", value: item.startDate },
                { label: "End Date", value: item.endDate },
                { label: "Grade", value: item.grade },
              ].map(({ label, value }) => (
                <div key={label} className="pd-spec-row">
                  <span className="pd-spec-label">{label}</span>
                  <span className={`pd-spec-value ${ value && value !== "—" ? "has-value" : "no-value" }`}>{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── History Page ──────────────────────────────────────────── */
function AuctionHistoryPage({ onViewDetails, auctionData, loading, walletAddress }) {
  const [complaintItem, setComplaintItem] = useState(null);

  const stats = {
    total: auctionData.length,
    won: auctionData.filter(a => a.status === "won").length,
    lost: auctionData.filter(a => a.status === "lost").length + auctionData.filter(a => a.status === "bid").length,
  };

  return (
    <main className="ahp-main">
      {complaintItem && <ComplaintModal item={complaintItem} onClose={() => setComplaintItem(null)} walletAddress={walletAddress} />}

      <div className="ahp-tag">Account Overview</div>

      <div className="ahp-top">
        <div>
          <h1 className="ahp-heading">Auction <span>History</span></h1>
          <p className="ahp-subtext">Your comprehensive record of high-value acquisitions, ongoing bids, and market activity.</p>
        </div>
      </div>

      <div className="ahp-stats">
        {[
          { icon: "↺", label: "Total Participations", value: loading ? "…" : String(stats.total), sub: "+3 this month" },
          { icon: "🏆", label: "Auctions Won", value: loading ? "…" : String(stats.won), sub: stats.total ? `${ Math.round(stats.won / stats.total * 100) }% success rate` : "—" },
          { icon: "⊙", label: "Outbid / Lost", value: loading ? "…" : String(stats.lost), sub: "Market competitive" },
        ].map(stat => (
          <div key={stat.label} className="ahp-stat-card">
            <div className="ahp-stat-icon">{stat.icon}</div>
            <div>
              <div className="ahp-stat-label">{stat.label}</div>
              <div className="ahp-stat-value">{stat.value}</div>
              <div className="ahp-stat-sub">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="ahp-table">
        <div className="ahp-thead">
          {["ITEM DETAIL", "DATE", "CATEGORY", "AMOUNT", "STATUS", "ACTIONS"].map(h => (
            <div key={h} className="ahp-th">{h}</div>
          ))}
        </div>

        {loading && (
          <div className="ahp-loading">
            <div className="ahp-spinner" />
            Loading your auction history…
          </div>
        )}

        {!loading && auctionData.length === 0 && (
          <div className="ahp-empty">No auction history found. Start bidding to see your history here!</div>
        )}

        {!loading && auctionData.map((item, i) => (
          <div key={item.id || i} className={`ahp-row ${ i < auctionData.length - 1 ? "bordered" : "" }`}>
            <div className="ahp-item-cell">
              {item.img && <img className="ahp-thumb" src={item.img} alt={item.title} />}
              <div>
                <div className="ahp-item-name">{item.title}</div>
                <div className="ahp-item-id">ID: {item.id}</div>
              </div>
            </div>
            <div>
              <div className="ahp-date-main">{item.date}</div>
              <div className="ahp-date-sub">{item.time}</div>
            </div>
            <div className="ahp-cat">{item.category}</div>
            <div className="ahp-amount">{item.finalAmount || item.currentBid}</div>
            <div className="ahp-status-cell">
              <span className={`ahp-status-badge status-${ item.status }`}>{item.statusLabel}</span>
              <span className="ahp-status-sub">• {item.subStatus}</span>
            </div>
            <div className="ahp-actions">
              <button className="ahp-view-btn" onClick={() => onViewDetails(item)}>View Details →</button>
              <button className="ahp-flag-btn" onClick={() => setComplaintItem(item)}>⚑</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

/* ─── EXPORT ────────────────────────────────────────────────── */
export default function AuctionHistory({ onNavigate, walletAddress, userData }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [auctionData, setAuctionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress || walletAddress.trim() === "") {
      console.log("[History] No wallet address, skipping fetch");
      setLoading(false);
      return;
    }

    console.log("[History] Fetching bids for wallet:", walletAddress);

    (async () => {
      try {
        const { bids } = await getMyBids();
        console.log("[History] Raw bids response:", bids);

        if (bids?.length > 0) {
          const auctionIds = [...new Set(bids.map(b => String(b.auctionId)).filter(Boolean))];
          console.log("[History] Unique auction IDs:", auctionIds);

          const auctionDetails = await Promise.allSettled(auctionIds.map(id => getAuction(id)));
          const auctionById = {};
          auctionDetails.forEach((result, idx) => {
            if (result.status === "fulfilled" && result.value) {
              const a = result.value.auction || result.value;
              auctionById[String(auctionIds[idx])] = a;
            }
          });

          const auctionMap = new Map();
          bids.forEach(b => {
            const key = String(b.auctionId || b._id);
            const existing = auctionMap.get(key);
            if (!existing || parseFloat(b.amount) > parseFloat(existing.amount)) {
              auctionMap.set(key, b);
            }
          });

          const rows = [...auctionMap.values()].map(b => {
            const auctionId = String(b.auctionId || b._id);
            const auctionData = auctionById[auctionId] || {};
            return normalizeAuctionRow({ ...b, ...auctionData, amount: b.amount }, walletAddress);
          });
          console.log("[History] Final rows:", rows.length, rows[0]);
          setAuctionData(rows);
          setLoading(false);
          return;
        } else {
          console.log("[History] No bids returned — checking raw response");
        }
      } catch (err) {
        console.error("[History] API bid history failed:", err.message);
      }

      // Fallback: blockchain
      try {
        const history = await fetchUserHistory(walletAddress);
        console.log("[History] Blockchain history:", history);
        const allIds = [...new Set([...history.created, ...history.bidOn, ...history.won])];
        if (allIds.length > 0) {
          const auctions = await Promise.all(allIds.map(id => fetchAuction(id)));
          const rows = auctions
            .filter(a => a && (a.title || a.headline) && (a.currentBid > 0 || a.openBid > 0 || a.imageUrl || a.image))
            .map(a => normalizeAuctionRow({ ...a, winner: a.highestBidder }, walletAddress));
          setAuctionData(rows);
        } else {
          setAuctionData([]);
        }
      } catch (err) {
        console.warn("[History] Blockchain history failed:", err.message);
        setAuctionData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [walletAddress]);

  return (
    <div className="ah-root">
      <div className="ah-bg-noise" />
      <div className="ah-bg-glow" />
      <SharedHeader walletAddress={walletAddress} onNewAuction={() => { }} onNavigate={onNavigate} />
      <div className="ah-content">
        {selectedItem
          ? <ProductDetail item={selectedItem} onBack={() => setSelectedItem(null)} walletAddress={walletAddress} />
          : <AuctionHistoryPage
            onViewDetails={item => setSelectedItem(item)}
            auctionData={auctionData}
            loading={loading}
            walletAddress={walletAddress}
          />
        }
      </div>
      <HamburgerFab onNavigate={onNavigate} />
    </div>
  );
}