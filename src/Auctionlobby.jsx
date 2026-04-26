import { useState, useEffect, useRef, useCallback } from "react";
import SharedHeader from "./SharedHeader";
import "./Auctionlobbyapp.css";

import {
  getAuctions, saveAuction, saveBid,
  joinAuction, leaveAuction, onNewBid, onAuctionEnded,
} from "./api";
import {
  createAuction as createAuctionOnChain,
  placeBid as placeBidOnChain,
  listenToBids,
} from "./blockchain";


const CATEGORY_LIST = ["Fine Art", "Luxury Watches", "Classic Cars", "Rare Coins", "Electronics", "Estate Jewelry", "Collectibles", "Wine & Spirits", "Real Estate", "Antiques", "Sports Memorabilia", "Luxury Bags", "Diamonds & Gems", "NFTs & Digital Art"];
const categories = ["All Auctions", ...CATEGORY_LIST];
const categoryOptions = CATEGORY_LIST;
/* ─── Currency config ────────────────────────────────────────── */
const CURRENCIES = [
  // Crypto
  { value: "ETH", label: "ETH (Ethereum)", symbol: "Ξ", crypto: true },
  { value: "BTC", label: "BTC (Bitcoin)", symbol: "₿", crypto: true },
  { value: "USDT", label: "USDT (Tether)", symbol: "$", crypto: true },
  { value: "USDC", label: "USDC (USD Coin)", symbol: "$", crypto: true },
  { value: "BNB", label: "BNB", symbol: "BNB ", crypto: true },
  { value: "SOL", label: "SOL (Solana)", symbol: "◎", crypto: true },
  { value: "XRP", label: "XRP", symbol: "✕", crypto: true },
  { value: "ADA", label: "ADA (Cardano)", symbol: "₳", crypto: true },
  { value: "DOGE", label: "DOGE (Dogecoin)", symbol: "Ð", crypto: true },
  { value: "MATIC", label: "MATIC (Polygon)", symbol: "⬡", crypto: true },
  // Fiat Major
  { value: "USD", label: "USD ($)", symbol: "$", crypto: false },
  { value: "EUR", label: "EUR (€)", symbol: "€", crypto: false },
  { value: "GBP", label: "GBP (£)", symbol: "£", crypto: false },
  { value: "JPY", label: "JPY (¥)", symbol: "¥", crypto: false },
  { value: "CHF", label: "CHF (Fr)", symbol: "Fr", crypto: false },
  { value: "CAD", label: "CAD ($)", symbol: "CA$", crypto: false },
  { value: "AUD", label: "AUD ($)", symbol: "A$", crypto: false },
  { value: "NZD", label: "NZD ($)", symbol: "NZ$", crypto: false },
  { value: "CNY", label: "CNY (¥)", symbol: "¥", crypto: false },
  { value: "HKD", label: "HKD ($)", symbol: "HK$", crypto: false },
  { value: "SGD", label: "SGD ($)", symbol: "S$", crypto: false },
  // Fiat Asia
  { value: "INR", label: "INR (₹)", symbol: "₹", crypto: false },
  { value: "KRW", label: "KRW (₩)", symbol: "₩", crypto: false },
  { value: "THB", label: "THB (฿)", symbol: "฿", crypto: false },
  { value: "MYR", label: "MYR (RM)", symbol: "RM", crypto: false },
  { value: "IDR", label: "IDR (Rp)", symbol: "Rp", crypto: false },
  { value: "PHP", label: "PHP (₱)", symbol: "₱", crypto: false },
  { value: "VND", label: "VND (₫)", symbol: "₫", crypto: false },
  { value: "BDT", label: "BDT (৳)", symbol: "৳", crypto: false },
  { value: "PKR", label: "PKR (₨)", symbol: "₨", crypto: false },
  // Fiat Middle East
  { value: "AED", label: "AED (د.إ)", symbol: "د.إ", crypto: false },
  { value: "SAR", label: "SAR (﷼)", symbol: "﷼", crypto: false },
  { value: "QAR", label: "QAR (﷼)", symbol: "QR", crypto: false },
  { value: "KWD", label: "KWD (KD)", symbol: "KD", crypto: false },
  { value: "ILS", label: "ILS (₪)", symbol: "₪", crypto: false },
  // Fiat Europe
  { value: "SEK", label: "SEK (kr)", symbol: "kr", crypto: false },
  { value: "NOK", label: "NOK (kr)", symbol: "kr", crypto: false },
  { value: "DKK", label: "DKK (kr)", symbol: "kr", crypto: false },
  { value: "PLN", label: "PLN (zł)", symbol: "zł", crypto: false },
  { value: "CZK", label: "CZK (Kč)", symbol: "Kč", crypto: false },
  { value: "HUF", label: "HUF (Ft)", symbol: "Ft", crypto: false },
  { value: "RUB", label: "RUB (₽)", symbol: "₽", crypto: false },
  { value: "TRY", label: "TRY (₺)", symbol: "₺", crypto: false },
  { value: "UAH", label: "UAH (₴)", symbol: "₴", crypto: false },
  // Fiat Americas & Africa
  { value: "BRL", label: "BRL (R$)", symbol: "R$", crypto: false },
  { value: "MXN", label: "MXN ($)", symbol: "MX$", crypto: false },
  { value: "ARS", label: "ARS ($)", symbol: "AR$", crypto: false },
  { value: "CLP", label: "CLP ($)", symbol: "CL$", crypto: false },
  { value: "COP", label: "COP ($)", symbol: "CO$", crypto: false },
  { value: "ZAR", label: "ZAR (R)", symbol: "R", crypto: false },
  { value: "NGN", label: "NGN (₦)", symbol: "₦", crypto: false },
  { value: "KES", label: "KES (KSh)", symbol: "KSh", crypto: false },
  { value: "EGP", label: "EGP (£)", symbol: "E£", crypto: false },
];
function getCurrencySymbol(code) {
  return CURRENCIES.find(c => c.value === code)?.symbol ?? code;
}
function fmt(n, currency = "USD") {
  const sym = getCurrencySymbol(currency);
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return `${ sym }0`;
  if (CURRENCIES.find(c => c.value === currency)?.crypto) return `${ sym } ${ num }`;
  return sym + num.toLocaleString();
}

/* ─── Timer hooks ────────────────────────────────────────────── */
function useCountdown(initial, auctionId, endDateStr) {
  const clamp = v => (typeof v === "number" && v > 0 && v < 86400 * 365) ? Math.floor(v) : 0;

  const getRemaining = () => {
    if (!auctionId) return clamp(initial);
    const key = `auction_end_${ auctionId }`;

    // If we have a real endDate from server, always use that — don't trust localStorage
    if (endDateStr) {
      const endsAt = new Date(endDateStr).getTime();
      const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
      // Update localStorage to keep it in sync
      localStorage.setItem(key, JSON.stringify({ endsAt }));
      return remaining;
    }

    // Fallback: use localStorage if available
    const saved = localStorage.getItem(key);
    if (saved) {
      const { endsAt } = JSON.parse(saved);
      return Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
    }

    // Last resort: use initial seconds
    if (!clamp(initial)) return 0;
    const endsAt = Date.now() + clamp(initial) * 1000;
    localStorage.setItem(key, JSON.stringify({ endsAt }));
    return clamp(initial);
  };

  const [sec, setSec] = useState(getRemaining);

  useEffect(() => {
    const t = setInterval(() => setSec(getRemaining()), 1000);
    return () => clearInterval(t);
  }, [auctionId, endDateStr]);

  return sec;
}
function formatTime(sec) {
  if (sec <= 0) return "ENDED";
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return `${ h }h ${ String(m).padStart(2, "0") }m ${ String(s).padStart(2, "0") }s`;
  return `${ String(m).padStart(2, "0") }m ${ String(s).padStart(2, "0") }s`;
}
function CardTimer({ initial, auctionId, endDate }) {
  const sec = useCountdown(initial, auctionId, endDate);
  const urgent = sec > 0 && sec < 300;
  return (
    <span className={`card-timer ${ sec === 0 ? "ended" : urgent ? "urgent" : "normal" }`}
      style={{ color: sec === 0 ? "#555" : urgent ? "#ff3b5c" : "#fff", fontWeight: 600, fontSize: 14 }}>
      {formatTime(sec)}
    </span>
  );
}
function HeroTimer({ initial, auctionId, endDate }) {
  const sec = useCountdown(initial, auctionId, endDate);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return <span>{String(h).padStart(2, "0")}h : {String(m).padStart(2, "0")}m : {String(s).padStart(2, "0")}s</span>;
}
function RoomCountdown({ initial, auctionId, endDate }) {
  const sec = useCountdown(initial, auctionId, endDate);
  return (
    <span style={{ color: sec < 60 ? "#ff3b5c" : "#fff" }}>
      {String(Math.floor(sec / 60)).padStart(2, "0")}:{String(sec % 60).padStart(2, "0")}
    </span>
  );
}

/* ─── Badges ─────────────────────────────────────────────────── */
function LiveBadge() {
  return (
    <span className="live-badge">
      <span className="live-badge-dot" />LIVE
    </span>
  );
}
function SoonBadge() {
  return <span className="soon-badge">SOON</span>;
}

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

/* ─── Section / Label helpers ────────────────────────────────── */
function Section({ title, subtitle, children }) {
  return (
    <div className="cs-section">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {children}
    </div>
  );
}
function Label({ children }) {
  return <div className="cs-label">{children}</div>;
}

/* ══════════════════════════════════════════════════════════════
   CONSIGNMENT FORM
══════════════════════════════════════════════════════════════ */
function ConsignmentForm({ onBack, onPublish, onNavigate, walletAddress }) {
  const [form, setForm] = useState({
    headline: "", category: "", openBid: "", reserve: "", buyNow: "",
    description: "", startDate: "", endDate: "", noReserve: false, agreed: false,
    grade: "", imagePreview: "", imageUrl: "", imageUrls: [], currency: "USD",
    sellerRate: 0,
  });
  const [payMethod, setPayMethod] = useState("");
  const [payNote, setPayNote] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [txError, setTxError] = useState('');
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isVideoFile = (file) => file.type?.startsWith("video/");

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    const blobPreviews = fileArr.map(f => ({ url: URL.createObjectURL(f), isVideo: isVideoFile(f) }));
    setForm(prev => ({
      ...prev,
      imagePreview: prev.imageUrls.length === 0 ? blobPreviews[0].url : prev.imagePreview,
      imageUrls: [...prev.imageUrls, ...blobPreviews.map(b => b.url)],
      mediaTypes: {
        ...prev.mediaTypes,
        ...Object.fromEntries(blobPreviews.map(b => [b.url, b.isVideo ? "video" : "image"])),
      },
    }));
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of fileArr) {
        const formData = new FormData();
        const isVid = isVideoFile(file);
        formData.append(isVid ? "video" : "image", file);
        const res = await fetch(isVid ? "/api/upload-video" : "/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        uploaded.push({ url, isVideo: isVid });
      }
      setForm(prev => {
        const existingReal = prev.imageUrls.filter(u => !u.startsWith("blob:"));
        const newTypes = {
          ...prev.mediaTypes,
          ...Object.fromEntries(uploaded.map(u => [u.url, u.isVideo ? "video" : "image"])),
        };
        const orderedUrls = [...existingReal, ...uploaded.map(u => u.url)];
        return { ...prev, imageUrls: orderedUrls, imageUrl: orderedUrls[0] || "", imagePreview: orderedUrls[0] || "", mediaTypes: newTypes };
      });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setForm(prev => {
      const updated = prev.imageUrls.filter((_, i) => i !== idx);
      return { ...prev, imageUrls: updated, imageUrl: updated[0] || "", imagePreview: updated[0] || "" };
    });
  };

  const reserveValid = form.noReserve || !form.reserve || parseFloat(form.reserve) >= parseFloat(form.openBid || 0);
  const canPublish = form.headline && form.category && form.openBid && form.agreed && !uploading && reserveValid;
  const selectedCurrency = CURRENCIES.find(c => c.value === form.currency) || CURRENCIES[2];
  const sym = selectedCurrency.symbol;
  const isCrypto = selectedCurrency.crypto;

  const openBidNum = parseFloat(form.openBid) || 0;
  const reserveNum = parseFloat(form.reserve) || 0;
  const hammerEstimate = Math.max(openBidNum, reserveNum) * 1.04;

  const fmtVal = (n) => {
    if (!n || isNaN(n)) return `${ sym }0`;
    if (isCrypto) return `${ sym } ${ n.toFixed(4) }`;
    return sym + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePublish = async () => {
    if (!canPublish) return;
    setTxError('');
    setPublishing(true);
    try {
      await saveAuction({
        title: form.headline, headline: form.headline, category: form.category,
        openBid: form.openBid, currentBid: form.openBid, reserve: form.reserve,
        buyNow: form.buyNow, description: form.description,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        noReserve: form.noReserve, grade: form.grade, currency: form.currency,
        imageUrl: form.imageUrls.filter(u => !u.startsWith("blob:"))[0] || "",
        images: form.imageUrls.filter(u => !u.startsWith("blob:")),
        txHash: null, auctionId: null, walletAddress, status: "active",
        paymentMethod: payMethod,
        sellerNote: payNote,
        mobileNumber: form.mobileNumber || "",
        walletPublicKey: form.walletPublicKey || "",
        walletQrUrl: form.walletQrUrl || "",
        upiId: form.upiId || "",
        upiQrUrl: form.upiQrUrl || "",
        bankName: form.bankName || "",
        accountNumber: form.accountNumber || "",
        ifscCode: form.ifscCode || "",
        accountHolder: form.accountHolder || "",
        mediaTypes: form.mediaTypes || {},
      }).catch(err => console.warn("DB save failed (non-blocking):", err.message));
      onPublish(form, null);
    } catch (err) {
      setTxError(err?.reason || err?.message || "Publish failed. Please try again.");
    } finally {
      setPublishing(false);
    }
  };
  const sampleImg = form.imagePreview || form.imageUrl || "";

  const durationMsg = (() => {
    if (!form.startDate || !form.endDate) return null;
    const diff = new Date(form.endDate) - new Date(form.startDate);
    if (diff <= 0) return { ok: false, text: "⚠ End date must be after start date" };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const parts = [];
    if (days > 0) parts.push(`${ days }d`);
    if (hours > 0) parts.push(`${ hours }h`);
    if (mins > 0) parts.push(`${ mins }m`);
    if (parts.length === 0) parts.push("< 1 minute");
    return { ok: true, text: `✓ Duration: ${ parts.join(" ") }` };
  })();

  return (
    <div className="cs-root">
      <SharedHeader onNewAuction={onBack} onNavigate={onNavigate} walletAddress={walletAddress} />
      <div className="cs-layout" autoComplete="off">

        {/* LEFT */}
        <div className="cs-left">
          <div className="cs-back-link" onClick={onBack}>
            <span>← BACK TO DASHBOARD</span>
          </div>

          <div className="cs-top-bar">
            <div>
              <h1>New Consignment</h1>
              <p>List your prestige asset for world-class private auctions.</p>
            </div>
            <div className="cs-top-actions">
              {txError && <div className="cs-tx-error">{txError}</div>}
              <div className="cs-btn-row">
                <button className={`draft-btn cs-draft-btn ${ draftSaved ? "saved" : "" }`}
                  onClick={() => setDraftSaved(true)}>
                  {draftSaved ? "✓ Draft Saved" : "Save Draft"}
                </button>
                <button className={`pub-btn cs-pub-btn ${ canPublish && !publishing ? "ready" : "disabled" }`}
                  onClick={handlePublish} disabled={!canPublish || publishing}>

                  {publishing ? (isCrypto ? "⏳ Confirm in MetaMask…" : "⏳ Publishing…") : "Publish Listing →"}
                </button>
              </div>
            </div>
          </div>

          <Section title="Asset Classification" subtitle="Precise metadata increases discoverability among verified high-net-worth collectors.">
            <div style={{ marginBottom: 14 }}>
              <Label>LISTING HEADLINE</Label>
              <input className="cs-input" placeholder="e.g. 1984 Ferrari 250 LM Prototype"
                value={form.headline} onChange={e => set("headline", e.target.value)} />
              <div className="cs-char-count">{form.headline.length}/80</div>
            </div>
            <div className="cs-grid-2">
              <div>
                <Label>CATEGORY SEGMENT</Label>
                <div className="cs-select-wrap">
                  <select className="cs-select" value={form.category} onChange={e => set("category", e.target.value)}>
                    <option value="">Select category</option>
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="cs-select-arrow">▾</span>
                </div>
              </div>
              <div>
                <Label>VERIFICATION GRADE</Label>
                <div className="cs-select-wrap">
                  <select className="cs-select" value={form.grade} onChange={e => set("grade", e.target.value)}>
                    <option value="">Select grade</option>
                    {["A+ Mint", "A Excellent", "B+ Very Good", "B Good", "C Fair"].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <span className="cs-select-arrow">▾</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Curated Media Gallery" subtitle="Include 360° views, interior details, and authentication stamps.">
            <div
              className={`cs-upload-zone ${ dragOver ? "drag" : "" }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current.click()}
            >
              {form.imageUrls.length > 0 ? (
                <div onClick={e => e.stopPropagation()}>
                  <div className="cs-img-grid">
                    {form.imageUrls.map((src, idx) => {
                      const isVid = form.mediaTypes?.[src] === "video" || isVideoUrl(src);
                      return (
                        <div key={idx} className={`cs-img-thumb ${ idx === 0 ? "main" : "" }`}>
                          {isVid
                            ? <video src={src} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                            : <img src={src} alt={`upload-${ idx }`} />
                          }
                          {idx === 0 && <div className="cs-img-main-badge">{isVid ? "🎬 VIDEO" : "MAIN"}</div>}
                          <button className="cs-img-remove" onClick={() => removeImage(idx)}>×</button>
                        </div>
                      );
                    })}
                    <div className="cs-img-add" onClick={() => fileRef.current.click()}>
                      <span className="cs-img-add-icon">+</span>
                      <span>Add more</span>
                    </div>
                  </div>
                  <div className="cs-upload-count">
                    {form.imageUrls.length} image{form.imageUrls.length !== 1 ? "s" : ""} uploaded · First image is the main listing photo
                  </div>
                  {uploading && (
                    <div className="cs-uploading">
                      <span className="cs-spinner-sm" />
                      <span>Uploading…</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="cs-upload-icon">⬆</div>
                  <div className="cs-upload-title">Drop high-resolution assets here</div>
                  <div className="cs-upload-hint">Supports JPEG, PNG, MP4, MOV — select multiple files (Max 50MB each)</div>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }}
                onChange={e => handleFiles(e.target.files)} />
            </div>
          </Section>

          <Section title="Historical Narrative" subtitle="Provenance matters. Tell the story of the asset.">
            <textarea className="cs-input" rows={6}
              placeholder="Describe the asset's history, provenance, and condition..."
              value={form.description} onChange={e => set("description", e.target.value)}
              style={{ borderRadius: 10, resize: "vertical", lineHeight: 1.7 }} />
          </Section>

          <Section title="Bidding Currency" subtitle="Choose the currency buyers will use to place bids.">
            <div className="cs-select-wrap">
              <select className="cs-select" value={form.currency} onChange={e => set("currency", e.target.value)}>
                <optgroup label="── Fiat Major">
                  {[{ value: 'USD', label: 'USD — US Dollar $' }, { value: 'EUR', label: 'EUR — Euro €' }, { value: 'GBP', label: 'GBP — British Pound £' }, { value: 'JPY', label: 'JPY — Japanese Yen ¥' }, { value: 'CHF', label: 'CHF — Swiss Franc Fr' }, { value: 'CAD', label: 'CAD — Canadian Dollar $' }, { value: 'AUD', label: 'AUD — Australian Dollar $' }, { value: 'NZD', label: 'NZD — New Zealand Dollar $' }, { value: 'CNY', label: 'CNY — Chinese Yuan ¥' }, { value: 'HKD', label: 'HKD — Hong Kong Dollar $' }, { value: 'SGD', label: 'SGD — Singapore Dollar $' }].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
                <optgroup label="── Fiat Asia">
                  {[{ value: 'INR', label: 'INR — Indian Rupee ₹' }, { value: 'KRW', label: 'KRW — South Korean Won ₩' }, { value: 'THB', label: 'THB — Thai Baht ฿' }, { value: 'MYR', label: 'MYR — Malaysian Ringgit RM' }, { value: 'IDR', label: 'IDR — Indonesian Rupiah Rp' }, { value: 'PHP', label: 'PHP — Philippine Peso ₱' }, { value: 'VND', label: 'VND — Vietnamese Dong ₫' }, { value: 'BDT', label: 'BDT — Bangladeshi Taka ৳' }, { value: 'PKR', label: 'PKR — Pakistani Rupee ₨' }].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
                <optgroup label="── Fiat Middle East">
                  {[{ value: 'AED', label: 'AED — UAE Dirham' }, { value: 'SAR', label: 'SAR — Saudi Riyal' }, { value: 'QAR', label: 'QAR — Qatari Riyal' }, { value: 'KWD', label: 'KWD — Kuwaiti Dinar' }, { value: 'ILS', label: 'ILS — Israeli Shekel ₪' }].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
                <optgroup label="── Fiat Europe">
                  {[{ value: 'SEK', label: 'SEK — Swedish Krona kr' }, { value: 'NOK', label: 'NOK — Norwegian Krone kr' }, { value: 'DKK', label: 'DKK — Danish Krone kr' }, { value: 'PLN', label: 'PLN — Polish Zloty zł' }, { value: 'CZK', label: 'CZK — Czech Koruna Kč' }, { value: 'HUF', label: 'HUF — Hungarian Forint Ft' }, { value: 'RUB', label: 'RUB — Russian Ruble ₽' }, { value: 'TRY', label: 'TRY — Turkish Lira ₺' }, { value: 'UAH', label: 'UAH — Ukrainian Hryvnia ₴' }].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
                <optgroup label="── Fiat Americas & Africa">
                  {[{ value: 'BRL', label: 'BRL — Brazilian Real R$' }, { value: 'MXN', label: 'MXN — Mexican Peso $' }, { value: 'ARS', label: 'ARS — Argentine Peso $' }, { value: 'CLP', label: 'CLP — Chilean Peso $' }, { value: 'COP', label: 'COP — Colombian Peso $' }, { value: 'ZAR', label: 'ZAR — South African Rand R' }, { value: 'NGN', label: 'NGN — Nigerian Naira ₦' }, { value: 'KES', label: 'KES — Kenyan Shilling KSh' }, { value: 'EGP', label: 'EGP — Egyptian Pound £' }].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
                <optgroup label="── Crypto">
                  {[
                    { value: 'BTC', label: 'BTC — Bitcoin (BTC)' },
                    { value: 'ETH', label: 'ETH — Ethereum (ETH)' },
                    { value: 'USDT', label: 'USDT — Tether ($)' },
                    { value: 'USDC', label: 'USDC — USD Coin ($)' },
                    { value: 'BNB', label: 'BNB — BNB' },
                    { value: 'SOL', label: 'SOL — Solana' },
                    { value: 'XRP', label: 'XRP — XRP' },
                    { value: 'ADA', label: 'ADA — Cardano' },
                    { value: 'DOGE', label: 'DOGE — Dogecoin' },
                    { value: 'MATIC', label: 'MATIC — Polygon' },
                  ].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
              </select>
              <span className="cs-select-arrow">▾</span>
            </div>
            {isCrypto && <div className="cs-crypto-notice" style={{ marginTop: 10 }}>🔗 Crypto bids will be processed on-chain via MetaMask. Buyers must have a Web3 wallet.</div>}
            {!isCrypto && <div className="cs-fiat-notice" style={{ marginTop: 10 }}>💳 Fiat bids are processed via your platform's payment gateway. No crypto wallet needed.</div>}
          </Section>

          <Section title="Valuation Strategy" subtitle={`Set your floor and ceiling. Prices in ${ form.currency || "your chosen currency" }.`}>
            <div className="cs-grid-3">
              {[["OPENING BID", "openBid", "e.g. 1000"], ["RESERVE PRICE", "reserve", "e.g. 5000"], ["BUY-IT-NOW", "buyNow", "Optional"]].map(([label, key, ph]) => (
                <div key={key}>
                  <Label>{label} ({form.currency || "—"})</Label>
                  <div className="cs-sym-wrap">
                    <span className="cs-sym-prefix">{sym}</span>
                    <input type="number" step={isCrypto ? "0.001" : "1"}
                      className="cs-input cs-sym-input" placeholder={ph}
                      autoComplete="off"
                      value={form[key]} onChange={e => set(key, e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            {form.reserve && parseFloat(form.reserve) < parseFloat(form.openBid || 0) && (
              <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>
                ⚠ Reserve price must be ≥ opening bid
              </div>
            )}
            <label className="cs-check-inline">
              <input type="checkbox" checked={form.noReserve}
                onChange={e => set("noReserve", e.target.checked)}
                style={{ accentColor: "#6366f1", width: 16, height: 16 }} />
              List as "No Reserve" to increase bidder engagement by ~40%.
            </label>
          </Section>

          <Section title="Logistics & Custody" subtitle="Set your auction start and end date/time.">
            <div className="cs-grid-2">
              <div>
                <Label>START DATE & TIME</Label>
                <input type="datetime-local" className="cs-input"
                  value={form.startDate || ""} onChange={e => set("startDate", e.target.value)}
                  style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <Label>END DATE & TIME</Label>
                <input type="datetime-local" className="cs-input"
                  value={form.endDate || ""} onChange={e => set("endDate", e.target.value)}
                  style={{ colorScheme: "dark" }} />
              </div>
            </div>
            {/* Quick duration buttons */}
            <div style={{ marginTop: 12 }}>
              <Label>QUICK DURATION (sets end date from start)</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {[
                  { label: "1 Hour", hours: 1 },
                  { label: "6 Hours", hours: 6 },
                  { label: "12 Hours", hours: 12 },
                  { label: "1 Day", hours: 24 },
                  { label: "3 Days", hours: 72 },
                  { label: "7 Days", hours: 168 },
                ].map(({ label, hours }) => (
                  <button
                    key={label}
                    type="button"
                    className="day-btn"
                    style={{
                      background: "#1a1a2e",
                      border: "1px solid #2a2a4e",
                      color: "#aaa",
                      borderRadius: 8,
                      padding: "6px 14px",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "'DM Sans',sans-serif",
                      transition: "all .18s",
                    }}
                    onClick={() => {
                      if (!form.startDate) {
                        alert("Please set a Start Date & Time first.");
                        return;
                      }
                      const base = new Date(form.startDate);
                      const end = new Date(base.getTime() + hours * 3600000);
                      const pad = n => String(n).padStart(2, "0");
                      const formatted = `${ end.getFullYear() }-${ pad(end.getMonth() + 1) }-${ pad(end.getDate()) }T${ pad(end.getHours()) }:${ pad(end.getMinutes()) }`;
                      set("endDate", formatted);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {durationMsg && (
              <div className={durationMsg.ok ? "cs-duration-ok" : "cs-duration-err"}>{durationMsg.text}</div>
            )}
          </Section>

          <Section title="Payment & Transaction Details" subtitle="How will the winning buyer pay? Add any special instructions.">

            <div style={{ marginBottom: 14 }}>
              <Label>PAYMENT METHOD</Label>
              <div className="cs-select-wrap" style={{ marginTop: 6 }}>
                <select className="cs-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="">Select payment method</option>
                  <optgroup label="── Digital / Crypto">
                    <option value="crypto">🔗 Crypto Wallet (MetaMask / Web3)</option>
                    <option value="usdt">💚 USDT / Stablecoin Transfer</option>
                    <option value="paypal">🅿️ PayPal</option>
                    <option value="stripe">💳 Stripe / Credit Card</option>
                    <option value="razorpay">💳 Razorpay</option>
                  </optgroup>
                  <optgroup label="── UPI / Bank">
                    <option value="upi">📱 UPI (GPay / PhonePe / Paytm)</option>
                    <option value="wire">🏦 Wire / Bank Transfer</option>
                    <option value="neft">🏦 NEFT / RTGS / IMPS</option>
                    <option value="sepa">🏦 SEPA Transfer (Europe)</option>
                    <option value="ach">🏦 ACH Transfer (USA)</option>
                  </optgroup>
                  <optgroup label="── Physical">
                    <option value="cash">💵 Cash on Delivery</option>
                    <option value="cheque">📝 Cheque / Demand Draft</option>
                    <option value="gold">🥇 Gold / Commodity Exchange</option>
                  </optgroup>
                  <optgroup label="── Secure">
                    <option value="escrow">🔒 Escrow Service</option>
                    <option value="lc">📄 Letter of Credit (LC)</option>
                    <option value="cod_verify">✅ Cash on Delivery + Verification</option>
                  </optgroup>
                </select>
                <span className="cs-select-arrow">▾</span>
              </div>
            </div>

            {/* Mobile Number — always shown */}
            <div style={{ marginBottom: 14 }}>
              <Label>MOBILE NUMBER (for transaction contact)</Label>
              <input className="cs-input" placeholder="e.g. +91 98765 43210"
                value={form.mobileNumber || ""}
                onChange={e => set("mobileNumber", e.target.value)} />
            </div>

            {/* Crypto fields */}
            {payMethod === "crypto" && (
              <div style={{ marginBottom: 14 }}>
                <Label>WALLET PUBLIC KEY / ADDRESS</Label>
                <input className="cs-input" placeholder="e.g. 0xda88...555c or bc1q..."
                  value={form.walletPublicKey || ""}
                  onChange={e => set("walletPublicKey", e.target.value)} />
                <div style={{ marginTop: 12 }}>
                  <Label>WALLET QR CODE (upload image)</Label>
                  <div className="cs-upload-zone" style={{ padding: 16, textAlign: "center", cursor: "pointer" }}
                    onClick={() => document.getElementById("wallet-qr-input").click()}>
                    {form.walletQrPreview
                      ? <img src={form.walletQrPreview} alt="Wallet QR" style={{ width: 150, height: 150, borderRadius: 8, margin: "0 auto", display: "block" }} />
                      : <><div className="cs-upload-icon">⬆</div><div className="cs-upload-title">Upload Wallet QR Code</div></>
                    }
                    <input id="wallet-qr-input" type="file" accept="image/*" style={{ display: "none" }}
                      onChange={async e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const preview = URL.createObjectURL(file);
                        set("walletQrPreview", preview);
                        try {
                          const formData = new FormData();
                          formData.append("image", file);
                          const res = await fetch("/api/upload", { method: "POST", body: formData });
                          const { url } = await res.json();
                          set("walletQrUrl", url);
                        } catch { set("walletQrUrl", preview); }
                      }} />
                  </div>
                </div>
                <div className="cs-pay-method-info" style={{ marginTop: 8 }}>🔗 Winner will send crypto directly to your wallet address above.</div>
              </div>
            )}

            {/* UPI fields */}
            {payMethod === "upi" && (
              <div style={{ marginBottom: 14 }}>
                <Label>UPI ID</Label>
                <input className="cs-input" placeholder="e.g. yourname@upi or yourname@okaxis"
                  value={form.upiId || ""}
                  onChange={e => set("upiId", e.target.value)} />
                <div style={{ marginTop: 12 }}>
                  <Label>UPI QR CODE (upload image)</Label>
                  <div className="cs-upload-zone" style={{ padding: 16, textAlign: "center", cursor: "pointer" }}
                    onClick={() => document.getElementById("upi-qr-input").click()}>
                    {form.upiQrPreview
                      ? <img src={form.upiQrPreview} alt="UPI QR" style={{ width: 150, height: 150, borderRadius: 8, margin: "0 auto", display: "block" }} />
                      : <><div className="cs-upload-icon">⬆</div><div className="cs-upload-title">Upload UPI QR Code</div></>
                    }
                    <input id="upi-qr-input" type="file" accept="image/*" style={{ display: "none" }}
                      onChange={async e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const preview = URL.createObjectURL(file);
                        set("upiQrPreview", preview);
                        try {
                          const formData = new FormData();
                          formData.append("image", file);
                          const res = await fetch("/api/upload", { method: "POST", body: formData });
                          const { url } = await res.json();
                          set("upiQrUrl", url);
                        } catch { set("upiQrUrl", preview); }
                      }} />
                  </div>
                </div>
                <div className="cs-pay-method-info" style={{ marginTop: 8 }}>📱 Winner will scan your UPI QR or use your UPI ID to pay directly.</div>
              </div>
            )}

            {/* Wire Transfer fields */}
            {payMethod === "wire" && (
              <div style={{ marginBottom: 14 }}>
                <div className="cs-grid-2">
                  <div>
                    <Label>BANK NAME</Label>
                    <input className="cs-input" placeholder="e.g. HDFC Bank"
                      value={form.bankName || ""} onChange={e => set("bankName", e.target.value)} />
                  </div>
                  <div>
                    <Label>ACCOUNT NUMBER</Label>
                    <input className="cs-input" placeholder="e.g. 1234567890"
                      value={form.accountNumber || ""} onChange={e => set("accountNumber", e.target.value)} />
                  </div>
                  <div>
                    <Label>IFSC / SWIFT CODE</Label>
                    <input className="cs-input" placeholder="e.g. HDFC0001234"
                      value={form.ifscCode || ""} onChange={e => set("ifscCode", e.target.value)} />
                  </div>
                  <div>
                    <Label>ACCOUNT HOLDER NAME</Label>
                    <input className="cs-input" placeholder="e.g. John Doe"
                      value={form.accountHolder || ""} onChange={e => set("accountHolder", e.target.value)} />
                  </div>
                </div>
                <div className="cs-pay-method-info" style={{ marginTop: 8 }}>🏦 Winner will initiate a wire transfer to your bank account above.</div>
              </div>
            )}

            {payMethod === "cash" && (
              <div className="cs-pay-method-info" style={{ marginBottom: 14 }}>💵 Physical handoff with cash payment. Coordinate delivery and payment in person via your mobile number.</div>
            )}

            {payMethod === "escrow" && (
              <div className="cs-pay-method-info" style={{ marginBottom: 14 }}>🔒 Funds held in escrow until asset is verified and delivered. Escrow service will contact you via mobile.</div>
            )}

            <div style={{ marginTop: 14 }}>
              <Label>SELLER NOTE TO BUYER (optional)</Label>
              <textarea className="cs-input" rows={3}
                placeholder="e.g. Payment must be completed within 48 hours of auction close..."
                value={payNote} onChange={e => setPayNote(e.target.value)}
                style={{ borderRadius: 10, resize: "vertical", lineHeight: 1.7 }} />
              <div className="cs-char-count">{payNote.length}/300</div>
            </div>

          </Section>
          <Section title="Agreement & Payout" subtitle="Review consignment terms.">
            <div className="cs-terms-box">
              <p>Seller acknowledges that G&amp;G takes a flat 6.5% commission on the final hammer price. This includes photography, global logistics insurance, and buyer fund verification.</p>
            </div>
            <label className="cs-check-label">
              <input type="checkbox" checked={form.agreed}
                onChange={e => set("agreed", e.target.checked)}
                style={{ accentColor: "#6366f1", width: 16, height: 16, marginTop: 2, flexShrink: 0 }} />
              <span><strong>Legal Affirmation</strong> — I certify I am the legal owner of this asset and authorize Gavel &amp; Grain to facilitate its sale.</span>
            </label>
          </Section>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="cs-sidebar">
          <div className="cs-preview-card">
            <div className="cs-preview-header">
              <div className="cs-preview-label">📺 LIVE AUCTION PREVIEW</div>
              {draftSaved && <span className="cs-draft-saved">✓ Draft Saved</span>}
            </div>
            <div className="cs-preview-img-wrap">
              {sampleImg
                ? (form.mediaTypes?.[sampleImg] === "video" || isVideoUrl(sampleImg)
                  ? <video className="cs-preview-img" src={sampleImg} autoPlay muted loop playsInline style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                  : <img className="cs-preview-img" src={sampleImg} alt="" />)
                : <div className="cs-preview-no-img">No image uploaded yet</div>
              }
              <div className="cs-preview-overlay" />
              <div className="cs-preview-bid">
                {form.openBid ? `${ sym } ${ form.openBid }` : `${ sym } —`}
              </div>
            </div>
            <div className="cs-preview-body">
              <div className="cs-preview-title">{form.headline || "Your listing headline here"}</div>
              {form.currency && (
                <div className="cs-preview-currency">Currency: <span>{form.currency}</span></div>
              )}
            </div>
          </div>

          <div className="cs-payout-card">
            <div className="cs-payout-label">◎ PAYOUT ESTIMATE</div>

            {/* Rate selector */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#888", letterSpacing: 1, marginBottom: 6 }}>YOUR SELLER FEE RATE</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {[0, 2, 5, 8, 10, 15].map(r => (
                  <button key={r} type="button"
                    onClick={() => set("sellerRate", r)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                      background: (form.sellerRate ?? 0) === r ? "#6366f1" : "#1a1a2e",
                      color: (form.sellerRate ?? 0) === r ? "#fff" : "#aaa",
                      border: (form.sellerRate ?? 0) === r ? "1px solid #6366f1" : "1px solid #2a2a4e",
                      fontFamily: "'DM Sans',sans-serif",
                    }}>
                    {r === 0 ? "No Fee" : `${ r }%`}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#888" }}>Custom:</span>
                <input type="number" min="0" max="100" step="0.5"
                  autoComplete="off"
                  value={form.sellerRate ?? 0}
                  onChange={e => set("sellerRate", parseFloat(e.target.value) || 0)}
                  style={{
                    width: 70, background: "#1a1a2e", border: "1px solid #2a2a4e",
                    color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 13,
                    fontFamily: "'DM Sans',sans-serif",
                  }} />
                <span style={{ fontSize: 12, color: "#888" }}>%</span>
              </div>
            </div>

            {openBidNum > 0 ? (() => {
              const rate = parseFloat(form.sellerRate ?? 0) || 0;
              const hammer = Math.max(openBidNum, reserveNum) * 1.04;
              const feeAmt = hammer * (rate / 100);
              const payout = hammer - feeAmt;
              return (
                <>
                  <div className="cs-payout-row">
                    <span className="cs-payout-row-label">Est. Hammer Price</span>
                    <span className="cs-payout-row-val">{fmtVal(hammer)}</span>
                  </div>
                  {rate > 0 && (
                    <div className="cs-payout-row">
                      <span className="cs-payout-row-label">Your Fee ({rate}%)</span>
                      <span className="cs-payout-row-val" style={{ color: "#ff3b5c" }}>-{fmtVal(feeAmt)}</span>
                    </div>
                  )}
                  <div className="cs-payout-total" style={{ marginTop: 10 }}>
                    <span>YOUR NET PAYOUT</span>
                    <span className="cs-payout-total-val">{fmtVal(payout)}</span>
                  </div>
                  <div className="cs-payout-hint">
                    {rate === 0 ? "No fee — full hammer price goes to you" : `After ${ rate }% fee deducted from hammer price`}
                  </div>
                </>
              );
            })() : (
              <div className="cs-payout-empty">Enter an opening bid to see your payout estimate</div>
            )}
          </div>
        </div>
      </div>
      <HamburgerFab onNavigate={onNavigate} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LOBBY
══════════════════════════════════════════════════════════════ */
function AuctionLobbyView({ onQuickJoin, onConsign, auctionItems, onNavigate, walletAddress, loading }) {
  const [activeFilter, setActiveFilter] = useState("All Auctions");
  const filtered = activeFilter === "All Auctions" ? auctionItems : auctionItems.filter(i => i.category === activeFilter);
  const heroItem = auctionItems.find(i => i.status === "LIVE") || auctionItems[0];

  return (
    <div className="al-root">
      <SharedHeader walletAddress={walletAddress} onNewAuction={onConsign} onNavigate={onNavigate} />


      <div className="al-trending-wrap">
        <div className="al-trending-top">
          <div>
            <div className="al-trending-title-row">
              <span className="al-trending-icon">📈</span>
              <span className="al-trending-title">
                Live &amp; Trending Auctions
                {loading && <span className="al-spinner-inline" />}
              </span>
            </div>
            <p className="al-trending-sub">High-engagement items ending soon across all categories.</p>
          </div>
          <button className="al-consign-btn" onClick={onConsign}>🔨 Start Consignment</button>
        </div>

        <div className="al-filters">
          <span className="al-filter-label">⚙ Filter By:</span>
          {categories.map(c => (
            <button key={c} className={`filter-chip al-filter-chip ${ activeFilter === c ? "active" : "inactive" }`}
              onClick={() => setActiveFilter(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="al-card-grid">
        {loading && filtered.length === 0 && (
          <div className="al-loading-center">
            <div className="al-spinner-lg" />
            <div className="al-loading-text">Loading auctions…</div>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="al-empty">
            <div className="al-empty-icon">🔨</div>
            <div className="al-empty-title">No auctions yet</div>
            <div className="al-empty-sub">Be the first to list an item for auction.</div>
            <button className="al-empty-btn" onClick={onConsign}>+ Start Consignment</button>
          </div>
        )}
        {filtered.map((item, i) => (
          <div key={item.mongoId ?? i}
            className={`card-hover al-card ${ item.isNew ? "new-item" : "" }`}
            style={{ animation: `fadeIn .4s ease ${ i * .07 }s both` }}>
            {item.isNew && <div className="al-card-top-bar" />}
            <div className="al-card-img-wrap">
              {item.image
                ? <img className="al-card-img" src={item.image} alt={item.title} />
                : <div className="al-card-no-img">No image</div>
              }
              <div className="al-card-status">
                {(() => {
                  const now = new Date();
                  const endDate = item.endDate ? new Date(item.endDate) : null;
                  const startDate = item.startDate ? new Date(item.startDate) : null;
                  if (startDate && startDate > now) {
                    return <span className="card-live-badge" style={{ background: "#f59e0b" }}>● SOON</span>;
                  }
                  if (endDate && endDate <= now) {
                    return <span className="card-live-badge" style={{ background: "#555" }}>● ENDED</span>;
                  }
                  return <span className="card-live-badge">● LIVE</span>;
                })()}
              </div>
              {item.currency && <div className="al-card-currency">{item.currency}</div>}
            </div>
            <div className="al-card-body">
              <h3 className="al-card-title">{item.title}</h3>
              <div className="al-card-bidders">👥 {item.bidders ?? 0} active bidders</div>
              <div className="al-card-info">
                <div>
                  <div className="al-card-bid-label">CURRENT BID</div>
                  <div className="al-card-bid-val">{fmt(item.currentBid, item.currency)}</div>
                </div>
                <div>
                  <div className="al-card-time-label">
                    {(() => {
                      const now = new Date();
                      const endDate = item.endDate ? new Date(item.endDate) : null;
                      const startDate = item.startDate ? new Date(item.startDate) : null;
                      if (startDate && startDate > now) return "STARTS IN";
                      if (endDate && endDate <= now) return "STATUS";
                      return "ENDS IN";
                    })()}
                  </div>
                  {(() => {
                    const now = new Date();
                    const endDate = item.endDate ? new Date(item.endDate) : null;
                    const startDate = item.startDate ? new Date(item.startDate) : null;
                    if (startDate && startDate > now) return <CardTimer initial={item.startsInSeconds ?? 0} auctionId={item.mongoId} endDate={item.startDate} />;
                    if (endDate && endDate <= now) return <span className="al-card-ended-text">Ended</span>;
                    return <CardTimer initial={item.initialSeconds ?? 0} auctionId={item.mongoId} endDate={item.endDate} />;
                  })()}
                </div>
              </div>
              <button className="quick-btn al-quick-btn" onClick={() => onQuickJoin(item)}>Quick Join</button>
            </div>
          </div>
        ))}
      </div>
      <HamburgerFab onNavigate={onNavigate} />
    </div>
  );
}

const isVideoUrl = (url) => /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i.test(url);

/* ══════════════════════════════════════════════════════════════
   LIVE AUCTION ROOM
══════════════════════════════════════════════════════════════ */
function LiveAuctionRoom({ item, onBack, onNavigate, walletAddress }) {
  const [showSlip, setShowSlip] = useState(false);
  const images = item?.images?.length > 0 ? item.images : [];
  const [activeImg, setActiveImg] = useState(0);
  const [imgKey, setImgKey] = useState(0);
  const [currentHighest, setHighest] = useState(() => parseFloat(item?.currentBid) || 0);
  const [leader, setLeader] = useState("—");
  const [bidAmount, setBidAmount] = useState(() => {
    const base = parseFloat(item?.currentBid) || 0;
    return parseFloat((base * 1.05 || 0.005).toFixed(4));
  });
  const [activity, setActivity] = useState([]);
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);
  const bidPanelRef = useRef();

  // Winner & payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentTab, setPaymentTab] = useState("wallet");
  const [paymentDone, setPaymentDone] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofUrl, setProofUrl] = useState("");
  const [generatingSlip, setGeneratingSlip] = useState(false);
  const proofInputRef = useRef();
  const sec = useCountdown(item?.initialSeconds ?? 0, item?.mongoId, item?.endDate);
  const isEnded = sec === 0;

  const currency = item?.currency || "USD";
  const isCrypto = CURRENCIES.find(c => c.value === currency)?.crypto ?? false;
  const sym = getCurrencySymbol(currency);
  const minNextBid = parseFloat((currentHighest * 1.01).toFixed(isCrypto ? 4 : 0));
  const bidStatus = bidAmount > 0 ? (bidAmount > currentHighest ? "high" : "low") : null;

  const goTo = idx => { setActiveImg(idx); setImgKey(k => k + 1); };
  const prev = () => goTo((activeImg - 1 + images.length) % images.length);
  const next = () => goTo((activeImg + 1) % images.length);

  const roomId = String(item?.mongoId || "");
  console.log("[LiveAuctionRoom] roomId:", roomId);

  const generatePaySlip = () => {
    setShowSlip(true);
  };

  useEffect(() => {

    if (!roomId) return;
    joinAuction(roomId);
    fetch(`/api/bids/${ roomId }`)
      .then(r => r.json())
      .then(data => {
        const bids = data.bids || data || [];
        if (bids?.length) {
          const sorted = [...bids].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
          const history = sorted.map(b => {
            const isMe = walletAddress && b.walletAddress && b.walletAddress.toLowerCase() === walletAddress.toLowerCase();


            return {
              user: isMe ? "You" : b.walletAddress ? `${ b.walletAddress.slice(0, 6) }…${ b.walletAddress.slice(-4) }` : "Anonymous",
              bid: b.amount,
              time: b.createdAt ? new Date(b.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "earlier",
            };
          });
          const topBid = parseFloat(sorted[0].amount);
          const topBidder = sorted[0];
          const isMe = walletAddress && topBidder?.walletAddress?.toLowerCase() === walletAddress?.toLowerCase();
          const leaderTag = isMe ? "You" : topBidder?.walletAddress ? `${ topBidder.walletAddress.slice(0, 6) }…${ topBidder.walletAddress.slice(-4) }` : "Anonymous";
          setActivity(history);
          setHighest(topBid);
          setLeader(leaderTag);
          setBidAmount(parseFloat((topBid * 1.01).toFixed(isCrypto ? 4 : 0)));
        }
      })
      .catch(err => console.warn("Failed to load bid history:", err));

    let socketWorking = false;
    let unsubSocket = () => { };
    let unsubChain = () => { };

    try {
      unsubSocket = onNewBid(data => {
        const incoming = String(data.auctionId ?? "");
        const mongo = String(item?.mongoId ?? "");
        const chain = String(item?.id ?? "");
        console.log("[newBid]", { incoming, mongo, chain, data });
        if (mongo || chain) { if (incoming !== mongo && incoming !== chain) return; }
        socketWorking = true;
        const amount = parseFloat(data.amount);
        const isMe = walletAddress && data.walletAddress && data.walletAddress.toLowerCase() === walletAddress.toLowerCase();

        // Skip socket update entirely if it's our own bid — we already added it locally
        if (isMe) return;

        setHighest(prev => amount > prev ? amount : prev);
        const bidderTag = data.walletAddress ? `${ data.walletAddress.slice(0, 6) }…${ data.walletAddress.slice(-4) }` : data.bidder?.slice(0, 10) ?? "Anonymous";
        setLeader(bidderTag);
        setActivity(p => {
          if (p[0]?.bid === data.amount && p[0]?.user === bidderTag) return p;
          return [{ user: bidderTag, bid: data.amount, time: "just now" }, ...p.slice(0, 19)];
        });
        if (bidPanelRef.current) {
          bidPanelRef.current.classList.remove("bid-flash");
          void bidPanelRef.current.offsetWidth;
          bidPanelRef.current.classList.add("bid-flash");
        }
      });
    } catch (err) { console.warn("Socket listener failed:", err.message); }

    const chainFallbackTimer = setTimeout(async () => {
      if (!socketWorking && isCrypto && item?.id && typeof item.id === "number") {
        try {
          unsubChain = await listenToBids(item.id, bid => {
            const amount = parseFloat(bid.amount);
            setHighest(prev => amount > prev ? amount : prev);
            setLeader(bid.bidder?.slice(0, 6) ?? "Anonymous");
            setActivity(p => [{ user: bid.bidder?.slice(0, 8) ?? "Anonymous", bid: bid.amount, time: "just now" }, ...p.slice(0, 19)]);
          });
        } catch (err) { console.warn("Blockchain listener also failed:", err.message); }
      }
    }, 3000);

    return () => {
      leaveAuction(roomId);
      unsubSocket();
      if (typeof unsubChain === "function") unsubChain();
      clearTimeout(chainFallbackTimer);
    };
  }, [roomId]);

  const handlePlaceBid = async () => {
    if (bidding) return;
    setBidError('');
    if (!bidAmount || parseFloat(bidAmount) <= parseFloat(currentHighest)) {
      setBidError(`Bid must be higher than current: ${ sym }${ currentHighest }`);
      return;
    }
    setBidding(true);
    try {
      let txHash = null;
      // Removed: on-chain creation is optional, not forced on publish
      // txHash and auctionId remain null unless explicitly triggered
      await saveBid({ auctionId: item.mongoId || item.id, amount: String(bidAmount), currency, txHash, walletAddress });
      setHighest(bidAmount);
      setLeader("You");
      setActivity(p => [{ user: "You", bid: bidAmount, time: "just now" }, ...p.slice(0, 19)]);
      setBidAmount(parseFloat((bidAmount * 1.01).toFixed(isCrypto ? 4 : 0)));
      setBidSuccess(true);
      setTimeout(() => setBidSuccess(false), 3000);
    } catch (err) {
      setBidError(err?.reason || err?.message || "Bid failed. Please try again.");
    } finally {
      setBidding(false);
    }
  };

  const quickAdds = isCrypto
    ? [["+0.001", 0.001], ["+0.005", 0.005], ["+0.01", 0.01]]
    : [["+100", 100], ["+500", 500], ["+1000", 1000]];

  return (
    <div className="room-root">
      <SharedHeader onNewAuction={onBack} onNavigate={onNavigate} walletAddress={walletAddress} />
      <div className="room-layout">

        {/* Left */}
        <div className="room-left">
          <div className="room-back-link" onClick={onBack}>
            <span className="room-back-arrow">←</span>
            <span className="room-back-text">BACK TO LOBBY</span>
          </div>

          <div className="room-main-img-wrap">
            {images.length > 0
              ? (() => {
                const src = images[activeImg];
                const isVid = item?.mediaTypes?.[src] === "video"
                  || isVideoUrl(src)
                  || /video/.test(src)
                  || ["mp4", "webm", "ogg", "mov", "avi", "mkv"].some(ext => src?.toLowerCase().includes(`.${ ext }`));
                return isVid
                  ? <video key={imgKey} className="room-main-img" src={src} controls playsInline crossOrigin="anonymous"
                    onError={e => console.error("Video error:", e.target.src, e.target.error)}
                    style={{ width: "100%", height: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 12, background: "#000" }} />
                  : <img key={imgKey} className="room-main-img" src={src} alt="auction item" />;
              })()
              : <div className="room-no-img">No image available</div>
            }
            {images.length > 1 && (
              <>
                <div className="room-dots">
                  {images.map((_, i) => (
                    <span key={i} className={`room-dot ${ i === activeImg ? "active" : "inactive" }`}
                      onClick={() => goTo(i)} />
                  ))}
                </div>
                <button className="arrow-btn room-arrow-btn left" onClick={prev}>‹</button>
                <button className="arrow-btn room-arrow-btn right" onClick={next}>›</button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="room-thumbs">
              {images.map((src, i) => {
                const isVid = item?.mediaTypes?.[src] === "video"
                  || isVideoUrl(src)
                  || ["mp4", "webm", "ogg", "mov", "avi", "mkv"].some(ext => src?.toLowerCase().includes(`.${ ext }`));
                return isVid
                  ? <div key={i}
                    className={`thumb room-thumb ${ i === activeImg ? "active" : "inactive" }`}
                    onClick={() => goTo(i)}
                    style={{ position: "relative", cursor: "pointer", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <video src={src} muted style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                    <span style={{ position: "absolute", fontSize: 18, color: "#fff" }}>▶</span>
                  </div>
                  : <img key={i} src={src} alt=""
                    className={`thumb room-thumb ${ i === activeImg ? "active" : "inactive" }`}
                    onClick={() => goTo(i)} />;
              })}
            </div>
          )}

          <h1 className="room-title">{item?.title || "Auction Item"}</h1>

          <div className="room-meta">
            {[
              { label: "Category", value: item?.category || "—", cls: "default" },
              { label: "Condition", value: item?.grade || "N/A", cls: "default" },
              { label: "Currency", value: currency, cls: "purple" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="room-meta-pill">
                <span className="room-meta-label">{label.toUpperCase()}</span>
                <span className={`room-meta-val ${ cls }`}>{value}</span>
              </div>
            ))}
          </div>

          {item?.description && (
            <div className="room-desc-box">
              <div className="room-desc-title">Item Description</div>
              <p className="room-desc-text">{item.description}</p>
            </div>
          )}
        </div>

        {showSlip && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, overflowY: "auto", padding: "40px 20px" }}>
            <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", color: "#111", borderRadius: 12, padding: 40, fontFamily: "Georgia,serif" }}>
              <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 2 }}>🔨 AUCTION HOUSE LIVE</div>
                <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Official Payment Receipt</div>
                <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 10 }}>AUCTION PAY SLIP</div>
              </div>
              <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 8, textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: "#777", textTransform: "uppercase", letterSpacing: 1 }}>Final Winning Bid</div>
                <div style={{ fontSize: 32, fontWeight: "bold", marginTop: 6 }}>
                  {isCrypto ? `Ξ ${ currentHighest }` : `${ sym }${ currentHighest.toLocaleString() }`}
                </div>
                <div style={{ display: "inline-block", background: "#111", color: "#fff", padding: "4px 14px", borderRadius: 20, fontSize: 11, marginTop: 8 }}>
                  {currency} · {item?.category || "—"}
                </div>
              </div>
              {[
                ["Auction ID", item?.mongoId || "—"],
                ["Item Title", item?.title || "—"],
                ["Category", item?.category || "—"],
                ["Grade", item?.grade || "N/A"],
                ["Currency", currency],
                ["Winner", leader],
                ["Payment Mode", offlineMode ? "Offline / Manual" : isCrypto ? "Crypto Wallet" : "UPI / Digital"],
                ["Start Date", item?.startDate ? new Date(item.startDate).toLocaleString() : "—"],
                ["End Date", new Date().toLocaleString()],
                ["Proof Uploaded", proofUrl ? "Yes" : "None"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee", fontSize: 14 }}>
                  <span style={{ color: "#555", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
              <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#999" }}>
                <p>Thank you for participating in Auction House Live.</p>
                <p>© {new Date().getFullYear()} Auction House Live. All rights reserved.</p>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button onClick={() => window.print()} style={{ flex: 1, padding: "12px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
                  🖨️ Print / Save PDF
                </button>
                <button onClick={() => setShowSlip(false)} style={{ flex: 1, padding: "12px", background: "#eee", color: "#111", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Right bid panel */}
        <div className="room-right">
          <div className="room-timer-card">
            <div className="room-timer-label">⏱ TIME REMAINING</div>
            <div className="room-timer-value"><RoomCountdown initial={item?.initialSeconds ?? 0} auctionId={item?.mongoId} endDate={item?.endDate} /></div>
          </div>

          {/* WINNER BANNER */}
          {isEnded && (
            <div className="winner-banner">
              <div className="winner-trophy">🏆</div>
              <div className="winner-title">Auction Ended!</div>
              <div className="winner-sub">Winner: <strong>{leader}</strong></div>
              <div className="winner-amount">{isCrypto ? `Ξ ${ currentHighest }` : `${ sym }${ currentHighest.toLocaleString() }`}</div>
              {leader === "You" && (
                <>
                  {!paymentDone ? (
                    <button className="winner-pay-btn" onClick={() => setShowPayment(true)}>
                      💳 Proceed to Payment →
                    </button>
                  ) : (
                    <button className="winner-slip-btn" onClick={() => setShowSlip(true)}>
                      📄 View Pay Slip
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* PAYMENT MODAL */}
          {showPayment && !paymentDone && leader === "You" && (
            <div className="pay-modal-overlay" onClick={() => setShowPayment(false)}>
              <div className="pay-modal" onClick={e => e.stopPropagation()}>
                <div className="pay-modal-header">
                  <span>💳 Complete Payment</span>
                  <button className="pay-modal-close" onClick={() => setShowPayment(false)}>×</button>
                </div>

                {/* Tabs */}
                <div className="pay-tabs">
                  <button className={`pay-tab ${ paymentTab === "wallet" ? "active" : "" }`} onClick={() => setPaymentTab("wallet")}>
                    🔗 Wallet / Crypto
                  </button>
                  <button className={`pay-tab ${ paymentTab === "upi" ? "active" : "" }`} onClick={() => setPaymentTab("upi")}>
                    📱 UPI / Bank
                  </button>
                </div>

                {/* Wallet Tab */}
                {paymentTab === "wallet" && (
                  <div className="pay-tab-body">
                    <div className="pay-qr-placeholder">
                      <img
                        src={item?.walletQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ item?.walletPublicKey || walletAddress || "auction-wallet" }`}
                        alt="Wallet QR"
                        style={{ width: 150, height: 150, borderRadius: 8, display: "block", margin: "0 auto" }}
                      />
                      <div className="pay-address">{item?.walletPublicKey || walletAddress || "0x1234...abcd"}</div>
                      <div className="pay-hint">{item?.sellerNote || "Send exact amount to this wallet address"}</div>
                    </div>
                    <div className="pay-amount-row">
                      Amount: <strong>{isCrypto ? `Ξ ${ currentHighest }` : `${ sym }${ currentHighest.toLocaleString() }`}</strong>
                    </div>
                  </div>
                )}

                {/* UPI Tab */}
                {paymentTab === "upi" && (
                  <div className="pay-tab-body">
                    <div className="pay-qr-placeholder">
                      <img
                        src={item?.upiQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${ item?.upiId || "auction@upi" }`}
                        alt="UPI QR"
                        style={{ width: 150, height: 150, borderRadius: 8, display: "block", margin: "0 auto" }}
                      />
                      <div className="pay-address">{item?.upiId || "auction@upi"}</div>
                      <div className="pay-hint">{item?.sellerNote || "Scan to pay via any UPI app"}</div>
                    </div>
                    <div className="pay-amount-row">
                      Amount: <strong>{sym}{currentHighest.toLocaleString()}</strong>
                    </div>
                  </div>
                )}

                {/* Offline proof */}
                <div className="pay-offline-box">
                  <label className="pay-offline-label">
                    <input type="checkbox" checked={offlineMode} onChange={e => setOfflineMode(e.target.checked)} />
                    &nbsp; Payment done in offline mode?
                  </label>
                  {offlineMode && (
                    <div className="pay-proof-row">
                      <button className="pay-proof-btn" onClick={() => proofInputRef.current.click()}>
                        📷 Upload Transaction Proof
                      </button>
                      <input ref={proofInputRef} type="file" accept="image/*" style={{ display: "none" }}
                        onChange={e => {
                          const f = e.target.files[0];
                          if (f) {
                            setProofFile(f);
                            setProofUrl(URL.createObjectURL(f));
                          }
                        }} />
                      {proofUrl && <img src={proofUrl} alt="proof" className="pay-proof-thumb" />}
                    </div>
                  )}
                </div>

                <button className="pay-confirm-btn" onClick={() => { setPaymentDone(true); setShowPayment(false); }}>
                  ✅ Confirm Payment Done
                </button>
              </div>
            </div>
          )}

          {/* Normal bid panel — only show when auction is live */}
          {!isEnded && (
            <>
              <div ref={bidPanelRef} className="room-highest-card">
                <div className="room-highest-label">CURRENT HIGHEST BID</div>
                <div className="room-highest-amount">
                  {isCrypto ? `Ξ ${ currentHighest }` : `${ sym }${ currentHighest.toLocaleString() }`}
                  &nbsp;<span className="room-currency-badge">{currency}</span>
                </div>
                <div className="room-leader">Leading: {leader}</div>
              </div>

              <div className="room-quick-adds">
                {quickAdds.map(([label, amt]) => (
                  <button key={label} className="bid-add room-quick-btn"
                    onClick={() => setBidAmount(b => parseFloat((b + amt).toFixed(isCrypto ? 4 : 0)))}>
                    <div className="room-quick-btn-sub">ADD</div>
                    {label} {isCrypto ? "Ξ" : sym}
                  </button>
                ))}
              </div>

              <div className="room-bid-input-wrap">
                <div className="room-bid-input-left">
                  <span className="room-bid-sym">{sym}</span>
                  <input type="number" step={isCrypto ? "0.001" : "1"}
                    className="room-bid-input"
                    value={bidAmount}
                    onChange={e => setBidAmount(parseFloat(e.target.value) || 0)} />
                </div>
                <span className="room-bid-min">
                  Min. {isCrypto ? `Ξ ${ minNextBid }` : `${ sym }${ minNextBid.toLocaleString() }`}
                </span>
              </div>

              <div className="room-bid-status-wrap">
                {bidStatus === "low" && (
                  <div className="bid-status-low">
                    ⚠️ Bid too low — must exceed {isCrypto ? `Ξ ${ currentHighest }` : `${ sym }${ currentHighest.toLocaleString() }`}
                  </div>
                )}
                {bidError && <div className="room-bid-error">{bidError}</div>}
              </div>

              <button className="room-place-bid-btn" onClick={handlePlaceBid}>
                {bidding ? (isCrypto ? "⏳ Confirm in MetaMask…" : "⏳ Placing bid…") : "🔨 PLACE YOUR BID"}
              </button>

              <div className="room-secured-label">🔒 SECURED BIDDING · {currency} CERTIFIED</div>
            </>
          )}

          <div className="room-activity">
            <div className="room-activity-header">
              <div className="room-activity-title">
                <span className="room-activity-icon">⚡</span> Live Activity
              </div>
              <LiveBadge />
            </div>
            <div className="room-activity-list">
              {activity.length === 0 && (
                <div className="room-activity-empty">No bids yet. Be the first!</div>
              )}
              {activity.slice(0, 8).map((a, i) => (
                <div key={i} className={`room-activity-row ${ i < activity.length - 1 ? "bordered" : "" }`}>
                  {a.type === "event"
                    ? <div className="room-activity-event">{a.text}</div>
                    : <div>
                      <span className="room-activity-user">{a.user}</span>
                      <span className="room-activity-bid">
                        &nbsp;bid {isCrypto ? `Ξ ${ a.bid }` : `${ sym }${ parseFloat(a.bid).toLocaleString() }`}
                      </span>
                    </div>
                  }
                  <div className="room-activity-time">{a.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <HamburgerFab onNavigate={onNavigate} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════════════════════════ */
export default function AuctionLobbyApp({ onNavigate, walletAddress, userData }) {
  const [view, setView] = useState("lobby");
  const [activeItem, setItem] = useState(null);
  const [auctionItems, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuctions = useCallback(async () => {
    try {
      const { auctions } = await getAuctions();
      console.log("RAW API:", auctions?.map(a => ({
        title: a.title,
        endDate: a.endDate,
        startDate: a.startDate
      })));
      if (auctions?.length > 0) {
        const apiItems = auctions.map(a => {
          const title = a.title || a.headline || "Untitled";
          const primaryImage = a.imageUrl || a.image || "";
          const extraImages = Array.isArray(a.images) ? a.images : [];
          // Combine: primaryImage first, then extras (deduplicated)
          const combined = [primaryImage, ...extraImages].filter(Boolean);
          const allImages = [...new Set(combined)];
          const now = new Date();
          const startDate = a.startDate ? new Date(a.startDate) : null;
          const endDate = (a.endDate || a.endsAt) ? new Date(a.endDate || a.endsAt) : null;
          let status, startsInSeconds = null, endsInSeconds = null;
          if (endDate && now >= endDate) {
            status = "ENDED";
          } else if (startDate && now < startDate) {
            status = "SOON";
            startsInSeconds = Math.max(0, Math.floor((startDate - now) / 1000));
          } else if (!endDate) {
            status = "ENDED";
            endsInSeconds = 0;
          } else {
            status = "LIVE";
            endsInSeconds = Math.max(0, Math.floor((endDate - now) / 1000));
          }
          return {
            id: typeof a.auctionId === "number" ? a.auctionId : typeof a.chainId === "number" ? a.chainId : null,
            mongoId: String(a._id),
            title, category: a.category || "Collectibles", currency: a.currency || "USD",
            currentBid: parseFloat(a.currentBid || a.openBid || 0), bidders: a.bidderCount || 0,
            initialSeconds: endsInSeconds ?? 0,
            endDate: a.endDate || a.endsAt || null,
            startDate: a.startDate || null,
            startsInSeconds, status,
            image: allImages[0] || "", images: allImages,
            description: a.description || "", grade: a.grade || "", isNew: false,
            mediaTypes: a.mediaTypes || {},
          };
        });
        setAuctions(apiItems);
      } else {
        setAuctions([]);
      }
    } catch (err) {
      console.warn("API fetch failed:", err.message);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 30000);
    return () => clearInterval(interval);
  }, [fetchAuctions]);

  const handlePublish = () => { fetchAuctions(); setView("lobby"); };

  if (view === "consign") return (
    <ConsignmentForm onBack={() => setView("lobby")} onPublish={handlePublish}
      onNavigate={onNavigate} walletAddress={walletAddress} />
  );
  if (view === "room") return (
    <LiveAuctionRoom item={activeItem} onBack={() => setView("lobby")}
      onNavigate={onNavigate} walletAddress={walletAddress} />
  );
  return (
    <AuctionLobbyView auctionItems={auctionItems}
      onQuickJoin={i => { setItem(i); setView("room"); }}
      onConsign={() => setView("consign")}
      onNavigate={onNavigate} walletAddress={walletAddress} loading={loading} />
  );
}