import React, { useState, useEffect, useRef } from 'react';
/* ─── NightSky UI Components (UI only, no logic) ─────────── */

function CustomDropdown({ value, onChange, options, renderSelected, renderOption, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <div onClick={() => setOpen(v => !v)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: open ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${ open ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)' }`,
        borderRadius: open ? '8px 8px 0 0' : '8px', cursor: 'pointer', transition: 'all 0.2s',
      }}>
        <span style={{ fontSize: 13.5, color: selected ? '#e2e8f0' : 'rgba(255,255,255,0.25)' }}>
          {selected ? renderSelected(selected) : placeholder}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: '#13152a', border: '1px solid rgba(99,102,241,0.3)',
          borderTop: 'none', borderRadius: '0 0 8px 8px',
          maxHeight: 220, overflowY: 'auto', boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}>
          {options.map(opt => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                background: opt.value === value ? 'rgba(99,102,241,0.18)' : 'transparent',
                color: opt.value === value ? '#a5b4fc' : '#c4c9e0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: 10,
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
              onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {renderOption(opt)}
              {opt.value === value && <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: 12 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CAL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CAL_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CAL_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function CustomDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('day'); // 'day' | 'month' | 'year'
  const [view, setView] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setMode('day'); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = value ? new Date(value) : null;
  const today = new Date();
  const yearStart = Math.floor(view.year / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i);
  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const selectDay = (day) => {
    if (!day) return;
    onChange(new Date(view.year, view.month, day).toISOString().split('T')[0]);
    setOpen(false); setMode('day');
  };
  const displayVal = selected ? selected.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  const navBtn = (onClick, label) => (
    <button type="button" onClick={onClick} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6, width: 30, height: 30, color: '#a5b4fc', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{label}</button>
  );
  const chipStyle = { fontSize: 13, fontWeight: 600, color: '#a5b4fc', cursor: 'pointer', padding: '3px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', transition: 'background 0.15s' };

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <div onClick={() => { setOpen(v => !v); setMode('day'); }} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: open ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${ open ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)' }`,
        borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
      }}>
        <span style={{ fontSize: 13.5, color: displayVal ? '#e2e8f0' : 'rgba(255,255,255,0.25)' }}>{displayVal || 'dd · mm · yyyy'}</span>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>📅</span>
      </div>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 999, background: '#13152a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.6)', width: 320 }}>

          {/* DAY VIEW */}
          {mode === 'day' && (<>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              {navBtn(() => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }), '‹')}
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={chipStyle} onClick={() => setMode('month')}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                >{CAL_MONTHS[view.month]}</span>
                <span style={chipStyle} onClick={() => setMode('year')}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
                >{view.year}</span>
              </div>
              {navBtn(() => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }), '›')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 6 }}>
              {CAL_DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', padding: '4px 0' }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {cells.map((day, i) => {
                const isSel = selected && day === selected.getDate() && view.month === selected.getMonth() && view.year === selected.getFullYear();
                const isToday = day === today.getDate() && view.month === today.getMonth() && view.year === today.getFullYear();
                return (
                  <div key={i} onClick={() => selectDay(day)} style={{
                    textAlign: 'center', padding: '7px 0', fontSize: 12, borderRadius: 6,
                    cursor: day ? 'pointer' : 'default',
                    background: isSel ? '#6366f1' : isToday ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: isSel ? '#fff' : isToday ? '#a5b4fc' : day ? '#c4c9e0' : 'transparent',
                    fontWeight: isSel || isToday ? 600 : 400,
                    border: isToday && !isSel ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  }}
                    onMouseEnter={e => { if (day && !isSel) e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; }}
                    onMouseLeave={e => { if (day && !isSel) e.currentTarget.style.background = isToday ? 'rgba(99,102,241,0.15)' : 'transparent'; }}
                  >{day}</div>
                );
              })}
            </div>
          </>)}

          {/* MONTH VIEW */}
          {mode === 'month' && (<>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              {navBtn(() => setView(v => ({ ...v, year: v.year - 1 })), '‹')}
              <span style={chipStyle} onClick={() => setMode('year')}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
              >{view.year}</span>
              {navBtn(() => setView(v => ({ ...v, year: v.year + 1 })), '›')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {CAL_MONTHS_SHORT.map((m, i) => {
                const isSel = i === view.month;
                return (
                  <div key={m} onClick={() => { setView(v => ({ ...v, month: i })); setMode('day'); }}
                    style={{ textAlign: 'center', padding: '10px 0', fontSize: 13, borderRadius: 8, cursor: 'pointer', fontWeight: isSel ? 700 : 400, background: isSel ? '#6366f1' : 'rgba(255,255,255,0.04)', color: isSel ? '#fff' : '#c4c9e0', border: isSel ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  >{m}</div>
                );
              })}
            </div>
          </>)}

          {/* YEAR VIEW */}
          {mode === 'year' && (<>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              {navBtn(() => setView(v => ({ ...v, year: v.year - 12 })), '‹')}
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{yearStart} – {yearStart + 11}</span>
              {navBtn(() => setView(v => ({ ...v, year: v.year + 12 })), '›')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {years.map(y => {
                const isSel = y === view.year;
                return (
                  <div key={y} onClick={() => { setView(v => ({ ...v, year: y })); setMode('month'); }}
                    style={{ textAlign: 'center', padding: '10px 0', fontSize: 13, borderRadius: 8, cursor: 'pointer', fontWeight: isSel ? 700 : 400, background: isSel ? '#6366f1' : 'rgba(255,255,255,0.04)', color: isSel ? '#fff' : '#c4c9e0', border: isSel ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  >{y}</div>
                );
              })}
            </div>
          </>)}

        </div>
      )}
    </div>
  );
}

function PhonePrefixDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef();
  const searchRef = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => { if (open && searchRef.current) searchRef.current.focus(); }, [open]);
  const selected = options.find(o => o.code === value);
  const filtered = search ? options.filter(o => o.country.toLowerCase().includes(search.toLowerCase()) || o.code.includes(search)) : options;
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0, width: 110 }}>
      <div onClick={() => setOpen(v => !v)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
        padding: '10px 10px', background: open ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${ open ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)' }`,
        borderRadius: open ? '8px 8px 0 0' : '8px', cursor: 'pointer',
      }}>
        <span style={{ fontSize: 13 }}>{selected?.flag}</span>
        <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{selected?.code}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 999, width: 230, background: '#13152a', border: '1px solid rgba(99,102,241,0.3)', borderTop: 'none', borderRadius: '0 0 10px 10px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} placeholder="Search country or code..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.length === 0 && <div style={{ padding: 14, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No results</div>}
            {filtered.map((opt, i) => (
              <div key={opt.code + i} onClick={() => { onChange(opt.code); setOpen(false); setSearch(''); }}
                style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, background: opt.code === value ? 'rgba(99,102,241,0.18)' : 'transparent', color: opt.code === value ? '#a5b4fc' : '#c4c9e0', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = opt.code === value ? 'rgba(99,102,241,0.18)' : 'transparent'; }}
              >
                <span style={{ fontSize: 15 }}>{opt.flag}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', minWidth: 36 }}>{opt.code}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{opt.country}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const NS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
  .ns-root { min-height: 100vh; background: #0d0f18; font-family: 'Sora', -apple-system, sans-serif; color: #e2e8f0; display: flex; flex-direction: column; }
  .ns-header { height: 56px; background: rgba(13,15,24,0.95); border-bottom: 1px solid rgba(99,102,241,0.12); display: flex; align-items: center; justify-content: space-between; padding: 0 28px; position: sticky; top: 0; z-index: 50; }
  .ns-logo { display: flex; align-items: center; gap: 9px; font-weight: 700; font-size: 15px; color: #fff; }
  .ns-logo-icon { width: 30px; height: 30px; background: linear-gradient(135deg,#6366f1,#8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
  .ns-body { flex: 1; padding: 32px 20px 48px; display: flex; flex-direction: column; align-items: center; }
  .ns-page-header { width: 100%; max-width: 860px; background: rgba(22,25,40,0.8); border: 1px solid rgba(99,102,241,0.14); border-radius: 14px; padding: 24px 36px 20px; text-align: center; margin-bottom: 10px; }
  .ns-page-header h1 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 6px; }
  .ns-page-header p { font-size: 13px; color: rgba(255,255,255,0.38); line-height: 1.5; }
  .ns-card { width: 100%; max-width: 860px; background: rgba(18,20,35,0.9); border: 1px solid rgba(99,102,241,0.13); border-radius: 14px; padding: 28px 44px 36px; }
  .ns-stepper { display: flex; align-items: center; justify-content: center; margin-bottom: 28px; }
  .ns-step { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
  .ns-step-circle { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.35); transition: all 0.25s; }
  .ns-step-circle.active { background: #6366f1; border-color: #6366f1; color: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
  .ns-step-circle.done { background: rgba(99,102,241,0.15); border-color: #6366f1; color: #6366f1; }
  .ns-step-label { font-size: 9.5px; font-weight: 600; letter-spacing: 0.8px; color: rgba(255,255,255,0.25); }
  .ns-step-label.active { color: #a5b4fc; }
  .ns-step-label.done { color: #6366f1; }
  .ns-step-line { width: 48px; height: 1.5px; background: rgba(255,255,255,0.07); margin: 0 6px 18px; flex-shrink: 0; transition: background 0.4s; }
  .ns-step-line.done { background: rgba(99,102,241,0.4); }
  .ns-section-label { display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 600; letter-spacing: 1.2px; color: rgba(255,255,255,0.3); margin-bottom: 10px; margin-top: 16px; }
  .ns-field { margin-bottom: 14px; }
  .ns-label { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; color: rgba(255,255,255,0.45); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .ns-input { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #e2e8f0; font-size: 13.5px; font-family: inherit; outline: none; transition: border-color 0.2s, background 0.2s; box-sizing: border-box; }
  .ns-input:focus { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.06); }
  .ns-input::placeholder { color: rgba(255,255,255,0.18); font-size: 13px; }
  .ns-input[readonly] { opacity: 0.5; cursor: not-allowed; }
  .ns-send-btn { padding: 10px 16px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; color: #a5b4fc; font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap; }
  .ns-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .ns-verify-btn { width: 100%; margin-top: 8px; padding: 10px; border-radius: 8px; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.25s; border: 1px solid rgba(99,102,241,0.3); background: rgba(99,102,241,0.08); color: #a5b4fc; }
  .ns-verify-btn.verified { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #34d399; cursor: not-allowed; }
  .ns-hint { font-size: 11px; color: rgba(255,255,255,0.22); margin-top: 5px; font-style: italic; display: block; }
  .ns-upload-box { position: relative; border: 1.5px dashed rgba(99,102,241,0.3); border-radius: 10px; padding: 1.25rem; text-align: center; background: rgba(99,102,241,0.04); cursor: pointer; }
  .ns-avatar-sublabel { font-size: 10px; color: rgba(255,255,255,0.18); }
  .ns-notif-list { display: flex; flex-direction: column; gap: 2px; }
  .ns-notif-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; cursor: pointer; transition: background 0.2s; }
  .ns-notif-row:hover { background: rgba(99,102,241,0.06); }
  .ns-notif-left { display: flex; align-items: center; gap: 12px; }
  .ns-notif-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(99,102,241,0.1); display: flex; align-items: center; justify-content: center; font-size: 14px; }
  .ns-notif-title { font-size: 13px; font-weight: 500; color: #e2e8f0; }
  .ns-notif-desc { font-size: 11px; color: rgba(255,255,255,0.3); }
  .ns-toggle { width: 20px; height: 20px; border-radius: 4px; border: 1.5px solid rgba(99,102,241,0.3); background: transparent; flex-shrink: 0; cursor: pointer; appearance: none; -webkit-appearance: none; transition: all 0.2s; position: relative; }
  .ns-toggle:checked { background: #6366f1; border-color: #6366f1; }
  .ns-toggle:checked::after { content: '✓'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700; }
  .ns-terms-box { background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.18); border-radius: 8px; padding: 14px; }
  .ns-terms-label { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }
  .ns-terms-check { width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid rgba(99,102,241,0.4); background: transparent; flex-shrink: 0; margin-top: 1px; cursor: pointer; appearance: none; -webkit-appearance: none; transition: all 0.2s; position: relative; }
  .ns-terms-check:checked { background: #6366f1; border-color: #6366f1; }
  .ns-terms-check:checked::after { content: '✓'; display: block; text-align: center; color: #fff; font-size: 11px; font-weight: 700; line-height: 15px; }
  .ns-terms-text { font-size: 12.5px; color: rgba(255,255,255,0.55); line-height: 1.6; }
  .ns-terms-text a { color: #a5b4fc; font-weight: 600; text-decoration: none; }
  .ns-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06); }
  .ns-btn-back { padding: 0.75rem 1.75rem; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: inherit; opacity: 1; }
  .ns-btn-back:disabled { opacity: 0.4; cursor: not-allowed; }
  .ns-btn-next { padding: 0.75rem 1.75rem; background: linear-gradient(135deg,#a78bfa,#8b5cf6); border: none; border-radius: 10px; color: #fff; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: inherit; box-shadow: 0 6px 20px rgba(139,92,246,0.35); }
  .ns-btn-submit { padding: 0.75rem 1.75rem; background: linear-gradient(135deg,#10b981,#059669); border: none; border-radius: 10px; color: #fff; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: inherit; box-shadow: 0 6px 20px rgba(16,185,129,0.35); display: flex; align-items: center; gap: 8px; }
  .ns-btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
  .ns-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: #ef4444; text-align: center; }
  .ns-wallet-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); border-radius: 20px; padding: 4px 14px; font-size: 12px; color: #a5b4fc; }
  @keyframes popIn { 0%{transform:scale(0);opacity:0} 100%{transform:scale(1);opacity:1} }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d0f18; } ::-webkit-scrollbar-thumb { background: #2a2a4e; border-radius: 4px; }
  select option { background: #1a1a2e !important; color: #e9d5ff !important; }
`;

/* ════════════════════════════════════════════════════════════
   ORIGINAL AuctionFormComplete — ALL LOGIC COPIED VERBATIM
   Only the returned JSX shell uses NightSky styling
════════════════════════════════════════════════════════════ */
const AuctionFormComplete = ({ onComplete, walletAddress }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({
    username: '', fullName: '', dateOfBirth: '', avatar: null,
    email: '', emailVerificationCode: '', countryCode: '+1', mobileNumber: '', timezone: '',
    streetAddress: '', apartment: '', city: '', state: '', postalCode: '', country: '',
    defaultCurrency: 'USD', taxId: '', notifyEveryBid: false, notifyOutbid: true, notifyBeforeEnd: true,
    agreeTerms: false
  });

  const [completedPages, setCompletedPages] = useState([]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // ✅ THIS WAS MISSING — caused "registrationSuccess is not defined" error
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const activityRef = useRef(0);

  useEffect(() => {
    const canvas = document.getElementById('ns-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const count = 80;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      z: Math.random() * 1000,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: -Math.random() * 1.5 - 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const activity = activityRef.current;
      activityRef.current = Math.max(0, activity - 0.015);

      const speed = 1 + activity * 6;

      for (const p of particles) {
        p.z += p.vz * speed;
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        if (p.z <= 0) p.z = 1000;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        const sx = (p.x - W / 2) * (600 / p.z) + W / 2;
        const sy = (p.y - H / 2) * (600 / p.z) + H / 2;
        const size = Math.max(0.2, (1 - p.z / 1000) * 2.5);
        const alpha = (1 - p.z / 1000) * (0.4 + activity * 0.5);

        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ 130 + Math.floor(activity * 80) }, 100, 255, ${ alpha })`;
        ctx.fill();
      }

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const sax = (a.x - W / 2) * (600 / a.z) + W / 2;
        const say = (a.y - H / 2) * (600 / a.z) + H / 2;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const sbx = (b.x - W / 2) * (600 / b.z) + W / 2;
          const sby = (b.y - H / 2) * (600 / b.z) + H / 2;
          const dist = Math.hypot(sax - sbx, say - sby);
          if (dist < 80 + activity * 60) {
            ctx.beginPath();
            ctx.moveTo(sax, say);
            ctx.lineTo(sbx, sby);
            ctx.strokeStyle = `rgba(99, 102, 241, ${ (1 - dist / 140) * 0.15 + activity * 0.1 })`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [registrationSuccess]);

  const triggerActivity = () => { activityRef.current = Math.min(1, activityRef.current + 0.3); };

  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setFormData(prev => ({ ...prev, timezone: detectedTimezone }));
  }, []);

  const pages = [
    { id: 0, title: 'Profile', desc: 'Your identity', icon: '👤' },
    { id: 1, title: 'Contact', desc: 'Stay connected', icon: '✉️' },
    { id: 2, title: 'Shipping', desc: 'Delivery address', icon: '📦' },
    { id: 3, title: 'Preferences', desc: 'Final settings', icon: '⚙️' }
  ];

  const countryCodes = [
    { code: '+1', country: 'US/CA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
  ];

  const currencies = [
    // Fiat — Major
    { code: 'USD', name: 'US Dollar', symbol: '$', emoji: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', emoji: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', emoji: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', emoji: '🇯🇵' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', emoji: '🇨🇭' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$', emoji: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$', emoji: '🇦🇺' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', emoji: '🇳🇿' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', emoji: '🇨🇳' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$', emoji: '🇭🇰' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: '$', emoji: '🇸🇬' },
    // Fiat — Asia
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', emoji: '🇮🇳' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', emoji: '🇰🇷' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: '$', emoji: '🇹🇼' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', emoji: '🇹🇭' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', emoji: '🇲🇾' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', emoji: '🇮🇩' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱', emoji: '🇵🇭' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', emoji: '🇻🇳' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', emoji: '🇧🇩' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', emoji: '🇵🇰' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', emoji: '🇱🇰' },
    // Fiat — Middle East
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', emoji: '🇦🇪' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', emoji: '🇸🇦' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', emoji: '🇶🇦' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', emoji: '🇰🇼' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', emoji: '🇮🇱' },
    { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', emoji: '🇯🇴' },
    { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', emoji: '🇮🇶' },
    { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', emoji: '🇮🇷' },
    // Fiat — Europe
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', emoji: '🇸🇪' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', emoji: '🇳🇴' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr', emoji: '🇩🇰' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', emoji: '🇵🇱' },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', emoji: '🇨🇿' },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', emoji: '🇭🇺' },
    { code: 'RON', name: 'Romanian Leu', symbol: 'lei', emoji: '🇷🇴' },
    { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', emoji: '🇭🇷' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', emoji: '🇷🇺' },
    { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', emoji: '🇺🇦' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', emoji: '🇹🇷' },
    // Fiat — Americas
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', emoji: '🇧🇷' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', emoji: '🇲🇽' },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$', emoji: '🇦🇷' },
    { code: 'CLP', name: 'Chilean Peso', symbol: '$', emoji: '🇨🇱' },
    { code: 'COP', name: 'Colombian Peso', symbol: '$', emoji: '🇨🇴' },
    { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', emoji: '🇵🇪' },
    { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs', emoji: '🇻🇪' },
    // Fiat — Africa
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', emoji: '🇿🇦' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', emoji: '🇳🇬' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', emoji: '🇰🇪' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', emoji: '🇬🇭' },
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', emoji: '🇪🇹' },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م', emoji: '🇲🇦' },
    { code: 'DZD', name: 'Algerian Dinar', symbol: 'دج', emoji: '🇩🇿' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: '£', emoji: '🇪🇬' },
    // Crypto
    { code: 'BTC', name: 'Bitcoin', symbol: '₿', emoji: '🟠' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', emoji: '🔷' },
    { code: 'USDT', name: 'Tether', symbol: '$', emoji: '💚' },
    { code: 'USDC', name: 'USD Coin', symbol: '$', emoji: '💵' },
    { code: 'BNB', name: 'BNB', symbol: 'BNB', emoji: '🟡' },
    { code: 'SOL', name: 'Solana', symbol: 'SOL', emoji: '🟣' },
    { code: 'XRP', name: 'XRP', symbol: 'XRP', emoji: '⚫' },
    { code: 'ADA', name: 'Cardano', symbol: 'ADA', emoji: '🔵' },
    { code: 'DOGE', name: 'Dogecoin', symbol: 'Ð', emoji: '🐶' },
    { code: 'MATIC', name: 'Polygon', symbol: 'MATIC', emoji: '🟪' },
  ];

  const handleInputChange = (e) => {
    triggerActivity();
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const [emailSending, setEmailSending] = useState(false);
  const [verificationCodeReal, setVerificationCodeReal] = useState('');

  const sendVerificationCode = async () => {
    if (!formData.email) return;
    setEmailSending(true);
    try {
      const res = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.username || 'User' })
      });
      const data = await res.json();
      if (data.success) setEmailMessage(`Code sent to ${ formData.email }!`);
      else setEmailMessage('Failed to send. Try again.');
    } catch (err) {
      alert('Server error. Try again.');
    } finally {
      setEmailSending(false);
    }
  };

  const verifyEmail = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: formData.emailVerificationCode })
      });
      const data = await res.json();
      if (data.success) {
        setEmailVerified(true);
        setEmailMessage('');
      } else {
        setEmailMessage(data.message || 'Invalid code.');
      }
    } catch (err) {
      setEmailMessage('Server error. Try again.');
    }
  };
  const validatePage = (pageId) => {
    switch (pageId) {
      case 0: return formData.username.trim() !== '' && formData.dateOfBirth !== '';
      case 1: return formData.email.trim() !== '' && emailVerified;
      case 2: return formData.streetAddress.trim() !== '' && formData.city.trim() !== '' && formData.country.trim() !== '';
      case 3: return formData.agreeTerms;
      default: return false;
    }
  };

  const nextPage = () => {
    if (validatePage(currentPage)) {
      if (!completedPages.includes(currentPage)) setCompletedPages([...completedPages, currentPage]);
      if (currentPage < pages.length - 1) setCurrentPage(currentPage + 1);
    } else alert('Please complete all required fields');
  };

  const prevPage = () => { if (currentPage > 0) setCurrentPage(currentPage - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePage(currentPage)) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const { ethers } = await import('ethers');

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });

      const CONTRACT_ADDRESS = '0x7f69F7A96a757675B83B22317a33f70166698cDa';
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const abi = [
        "function registerUser(string _username, string _email, string _country, string _currency) external"
      ];

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.registerUser(
        formData.username,
        formData.email,
        formData.country,
        formData.defaultCurrency,
        {
          gasPrice: ethers.parseUnits('1', 'gwei'),
        }
      );

      await tx.wait();

      await onComplete({ ...formData, walletAddress, profileCompleted: true });
      setRegistrationSuccess(true);

    } catch (err) {
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setSubmitError('Transaction rejected. You must confirm to complete registration.');
      } else if (err.message?.includes('INSUFFICIENT_FUNDS') || err.message?.includes('insufficient funds')) {
        setSubmitError('Insufficient funds in your wallet to cover gas fees. Please add ETH to your wallet and try again.');
      } else if (err.message?.includes('network') || err.message?.includes('chain')) {
        setSubmitError('Network error. Please make sure you are connected to the Sepolia testnet.');
      } else {
        setSubmitError('Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ SUCCESS SCREEN — original logic, NightSky UI
  if (registrationSuccess) return (
    <div className="ns-root" style={{ position: 'relative', overflow: 'hidden' }}>
      <style>{NS_CSS}</style>
      <canvas id="ns-bg-canvas" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
      <header className="ns-header">
        <div className="ns-logo"><div className="ns-logo-icon">✦</div>BidMaster</div>
      </header>
      <div className="ns-body" style={{ justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center', background: 'rgba(26,26,46,0.9)', backdropFilter: 'blur(30px)', borderRadius: 24, padding: '3rem 2.5rem', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(16,185,129,0.4)', animation: 'popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
            <span style={{ fontSize: '2.5rem' }}>✓</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Registration Complete!</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', marginBottom: '2rem' }}>Your BidMaster account has been successfully created and verified.</p>
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>VERIFIED WALLET</div>
            <div style={{ fontSize: 14, color: '#34d399', fontWeight: 600, fontFamily: 'monospace' }}>{walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            {[
              { icon: '👤', label: 'Username', value: formData.username },
              { icon: '✉️', label: 'Email', value: formData.email },
              { icon: '🌍', label: 'Country', value: formData.country },
              { icon: '💱', label: 'Currency', value: formData.defaultCurrency },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{item.icon} {item.label}</span>
                <span style={{ fontSize: 13, color: '#e9d5ff', fontWeight: 500 }}>{item.value || '—'}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '2rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '0.6rem 1rem' }}>
            <span style={{ fontSize: 16 }}>🔐</span>
            <span style={{ fontSize: 13, color: '#a5b4fc' }}>Wallet ownership verified via MetaMask signature</span>
          </div>
          <button onClick={() => onComplete({ ...formData, walletAddress, profileCompleted: true })}
            style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: 12, color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.35)' }}>
            🚀 Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  // ── MAIN FORM ─────────────────────────────────────────────
  const pageTitles = [
    { heading: 'Create Your Profile', sub: "Let's start with the basics to personalize your experience." },
    { heading: 'Contact Details', sub: 'Verify your information to keep your account secure.' },
    { heading: 'Shipping Address', sub: 'Tell us where to send your auction wins.' },
    { heading: 'Account Preferences', sub: 'Tailor your bidding experience with personalized settings.' },
  ];
  const currencyOptions = currencies.map(c => ({ value: c.code, label: c.name, symbol: c.symbol, emoji: c.emoji }));

  const countryCodeToTimezone = {
    '+1': 'America/New_York',
    '+7': 'Europe/Moscow',
    '+20': 'Africa/Cairo',
    '+27': 'Africa/Johannesburg',
    '+30': 'Europe/Athens',
    '+31': 'Europe/Amsterdam',
    '+32': 'Europe/Brussels',
    '+33': 'Europe/Paris',
    '+34': 'Europe/Madrid',
    '+36': 'Europe/Budapest',
    '+39': 'Europe/Rome',
    '+40': 'Europe/Bucharest',
    '+41': 'Europe/Zurich',
    '+43': 'Europe/Vienna',
    '+44': 'Europe/London',
    '+45': 'Europe/Copenhagen',
    '+46': 'Europe/Stockholm',
    '+47': 'Europe/Oslo',
    '+48': 'Europe/Warsaw',
    '+49': 'Europe/Berlin',
    '+51': 'America/Lima',
    '+52': 'America/Mexico_City',
    '+54': 'America/Argentina/Buenos_Aires',
    '+55': 'America/Sao_Paulo',
    '+56': 'America/Santiago',
    '+57': 'America/Bogota',
    '+58': 'America/Caracas',
    '+60': 'Asia/Kuala_Lumpur',
    '+61': 'Australia/Sydney',
    '+62': 'Asia/Jakarta',
    '+63': 'Asia/Manila',
    '+64': 'Pacific/Auckland',
    '+65': 'Asia/Singapore',
    '+66': 'Asia/Bangkok',
    '+81': 'Asia/Tokyo',
    '+82': 'Asia/Seoul',
    '+84': 'Asia/Ho_Chi_Minh',
    '+86': 'Asia/Shanghai',
    '+90': 'Europe/Istanbul',
    '+91': 'Asia/Kolkata',
    '+92': 'Asia/Karachi',
    '+93': 'Asia/Kabul',
    '+94': 'Asia/Colombo',
    '+98': 'Asia/Tehran',
    '+212': 'Africa/Casablanca',
    '+213': 'Africa/Algiers',
    '+218': 'Africa/Tripoli',
    '+220': 'Africa/Banjul',
    '+221': 'Africa/Dakar',
    '+233': 'Africa/Accra',
    '+234': 'Africa/Lagos',
    '+251': 'Africa/Addis_Ababa',
    '+254': 'Africa/Nairobi',
    '+880': 'Asia/Dhaka',
    '+962': 'Asia/Amman',
    '+964': 'Asia/Baghdad',
    '+965': 'Asia/Kuwait',
    '+966': 'Asia/Riyadh',
    '+971': 'Asia/Dubai',
    '+972': 'Asia/Jerusalem',
    '+886': 'Asia/Taipei',
    '+852': 'Asia/Hong_Kong',
    '+380': 'Europe/Kiev',
    '+351': 'Europe/Lisbon',
    '+353': 'Europe/Dublin',
    '+358': 'Europe/Helsinki',
    '+420': 'Europe/Prague',
    '+385': 'Europe/Zagreb',
    '+386': 'Europe/Ljubljana',
  };

  const renderCurrencySelected = (opt) => (
    <span>{opt.emoji} {opt.symbol} {opt.value} {opt.label}</span>
  );

  const renderCurrencyOption = (opt) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>{opt.emoji}</span>
      <span style={{ color: 'rgba(255,255,255,0.5)', minWidth: 30 }}>{opt.symbol}</span>
      <span>{opt.value}</span>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{opt.label}</span>
    </div>
  );

  return (
    <div className="ns-root">
      <style>{NS_CSS}</style>

      <header className="ns-header">
        <div className="ns-logo"><div className="ns-logo-icon">✦</div>BidMaster</div>
        {walletAddress && (
          <div className="ns-wallet-badge">🔗 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</div>
        )}
      </header>

      <div className="ns-body" style={{ position: 'relative', zIndex: 1 }}>
        <div className="ns-page-header">
          <h1>{pageTitles[currentPage].heading}</h1>
          <p>{pageTitles[currentPage].sub}</p>
        </div>

        <div className="ns-card">
          {submitError && <div className="ns-error">{submitError}</div>}

          {/* Stepper */}
          <div className="ns-stepper">
            {pages.map((page, index) => {
              const isActive = index === currentPage;
              const isCompleted = completedPages.includes(index);
              return (
                <React.Fragment key={page.id}>
                  <div className="ns-step">
                    <div className={`ns-step-circle ${ isCompleted ? 'done' : isActive ? 'active' : '' }`}>
                      {isCompleted ? '✓' : page.icon}
                    </div>
                    <div className={`ns-step-label ${ isCompleted ? 'done' : isActive ? 'active' : '' }`}>{page.title}</div>
                  </div>
                  {index < pages.length - 1 && <div className={`ns-step-line ${ isCompleted ? 'done' : '' }`} />}
                </React.Fragment>
              );
            })}
          </div>

          <form onSubmit={handleSubmit}>

            {/* Page 0: Profile */}
            {currentPage === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div className="ns-label">USERNAME <span style={{ color: '#f87171' }}>*</span></div>
                  <input type="text" name="username" value={formData.username} onChange={handleInputChange}
                    className="ns-input" placeholder="Your unique username" required />
                </div>
                <div>
                  <div className="ns-label">FULL NAME</div>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
                    className="ns-input" placeholder="Your legal name" />
                </div>
                <div>
                  <div className="ns-label">DATE OF BIRTH <span style={{ color: '#f87171' }}>*</span></div>
                  <CustomDatePicker value={formData.dateOfBirth} onChange={v => setFormData(prev => ({ ...prev, dateOfBirth: v }))} />
                  {(() => {
                    if (!formData.dateOfBirth) return <span className="ns-hint">Must be 18+ years old</span>;
                    const dob = new Date(formData.dateOfBirth);
                    const today = new Date();
                    let age = today.getFullYear() - dob.getFullYear();
                    const m = today.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                    const valid = age >= 18;
                    return (
                      <span style={{ fontSize: 11, marginTop: 5, fontStyle: 'italic', display: 'block', color: valid ? '#34d399' : '#f87171' }}>
                        {valid ? `✓ Age: ${ age } years old — Eligible` : `✗ Age: ${ age } years old — Must be 18+`}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <div className="ns-label">PROFILE AVATAR (OPTIONAL)</div>
                  <div className="ns-upload-box">
                    <input type="file" onChange={handleFileChange} accept="image/*"
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    {avatarPreview ? (
                      <>
                        <img src={avatarPreview} alt="Avatar preview"
                          style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px', display: 'block', border: '2px solid rgba(99,102,241,0.5)' }} />
                        <div style={{ color: '#34d399', fontWeight: 600, fontSize: '0.85rem' }}>✓ {formData.avatar.name}</div>
                        <div className="ns-avatar-sublabel">Click to change</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>📸</div>
                        <div style={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.85rem' }}>Upload Image</div>
                        <div className="ns-avatar-sublabel">PNG, JPG up to 10MB</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Page 1: Contact */}
            {currentPage === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="ns-section-label">✉ EMAIL ADDRESS</div>
                <div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                      className="ns-input" placeholder="you@example.com" required style={{ flex: 1 }} />
                    <button type="button" onClick={sendVerificationCode} disabled={!formData.email || emailSending} className="ns-send-btn">
                      {emailSending ? '⏳ Sending...' : 'Send Code'}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="ns-label">VERIFICATION CODE <span style={{ color: '#f87171' }}>*</span></div>
                  <input type="text" name="emailVerificationCode" value={formData.emailVerificationCode}
                    onChange={handleInputChange} className="ns-input" placeholder="Enter 6-digit code" />
                  <button type="button" onClick={verifyEmail}
                    disabled={!formData.emailVerificationCode || emailVerified}
                    className={`ns-verify-btn ${ emailVerified ? 'verified' : '' }`}>
                    {emailVerified ? '✓ Email Verified' : 'Verify Email'}
                  </button>

                  {/* ✅ ADD THIS */}
                  {emailMessage && (
                    <div style={{
                      marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12,
                      background: emailMessage.includes('sent') ? 'rgba(99,102,241,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${ emailMessage.includes('sent') ? 'rgba(99,102,241,0.3)' : 'rgba(239,68,68,0.3)' }`,
                      color: emailMessage.includes('sent') ? '#a5b4fc' : '#f87171',
                    }}>
                      {emailMessage}
                    </div>
                  )}
                </div>
                <div className="ns-section-label">📞 PHONE NUMBER</div>
                <div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <PhonePrefixDropdown value={formData.countryCode} onChange={code => setFormData(prev => ({ ...prev, countryCode: code, timezone: countryCodeToTimezone[code] || prev.timezone }))} options={countryCodes} />
                    <input type="tel" name="mobileNumber" value={formData.mobileNumber}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        const formatted = digits.length <= 3 ? digits
                          : digits.length <= 6 ? `${ digits.slice(0, 3) }-${ digits.slice(3) }`
                            : `${ digits.slice(0, 3) }-${ digits.slice(3, 6) }-${ digits.slice(6) }`;
                        setFormData(prev => ({ ...prev, mobileNumber: formatted }));
                      }}
                      className="ns-input" placeholder="XXX-XXX-XXXX" style={{ flex: 1 }} maxLength={12} />
                  </div>
                </div>
                <div>
                  <div className="ns-label">TIMEZONE</div>
                  <input type="text" name="timezone" value={formData.timezone} readOnly className="ns-input" />
                  <span className="ns-hint">Auto-detected</span>
                </div>
              </div>
            )}

            {/* Page 2: Shipping */}
            {currentPage === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div className="ns-label">STREET ADDRESS <span style={{ color: '#f87171' }}>*</span></div>
                    <input type="text" name="streetAddress" value={formData.streetAddress}
                      onChange={handleInputChange} className="ns-input" placeholder="123 Main Street" required />
                  </div>
                  <div>
                    <div className="ns-label">APT/SUITE</div>
                    <input type="text" name="apartment" value={formData.apartment}
                      onChange={handleInputChange} className="ns-input" placeholder="4B" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div className="ns-label">CITY <span style={{ color: '#f87171' }}>*</span></div>
                    <input type="text" name="city" value={formData.city} onChange={handleInputChange}
                      className="ns-input" placeholder="New York" required />
                  </div>
                  <div>
                    <div className="ns-label">STATE/PROVINCE</div>
                    <input type="text" name="state" value={formData.state} onChange={handleInputChange}
                      className="ns-input" placeholder="NY" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div className="ns-label">POSTAL CODE</div>
                    <input type="text" name="postalCode" value={formData.postalCode}
                      onChange={handleInputChange} className="ns-input" placeholder="10001" />
                  </div>
                  <div>
                    <div className="ns-label">COUNTRY <span style={{ color: '#f87171' }}>*</span></div>
                    <CustomDropdown
                      value={formData.country}
                      onChange={v => setFormData(prev => ({ ...prev, country: v }))}
                      options={[
                        { value: 'Afghanistan', label: '🇦🇫 Afghanistan' }, { value: 'Albania', label: '🇦🇱 Albania' },
                        { value: 'Algeria', label: '🇩🇿 Algeria' }, { value: 'Argentina', label: '🇦🇷 Argentina' },
                        { value: 'Australia', label: '🇦🇺 Australia' }, { value: 'Austria', label: '🇦🇹 Austria' },
                        { value: 'Bangladesh', label: '🇧🇩 Bangladesh' }, { value: 'Belgium', label: '🇧🇪 Belgium' },
                        { value: 'Brazil', label: '🇧🇷 Brazil' }, { value: 'Canada', label: '🇨🇦 Canada' },
                        { value: 'Chile', label: '🇨🇱 Chile' }, { value: 'China', label: '🇨🇳 China' },
                        { value: 'Colombia', label: '🇨🇴 Colombia' }, { value: 'Croatia', label: '🇭🇷 Croatia' },
                        { value: 'Czech Republic', label: '🇨🇿 Czech Republic' }, { value: 'Denmark', label: '🇩🇰 Denmark' },
                        { value: 'Egypt', label: '🇪🇬 Egypt' }, { value: 'Ethiopia', label: '🇪🇹 Ethiopia' },
                        { value: 'Finland', label: '🇫🇮 Finland' }, { value: 'France', label: '🇫🇷 France' },
                        { value: 'Germany', label: '🇩🇪 Germany' }, { value: 'Ghana', label: '🇬🇭 Ghana' },
                        { value: 'Greece', label: '🇬🇷 Greece' }, { value: 'Hong Kong', label: '🇭🇰 Hong Kong' },
                        { value: 'Hungary', label: '🇭🇺 Hungary' }, { value: 'India', label: '🇮🇳 India' },
                        { value: 'Indonesia', label: '🇮🇩 Indonesia' }, { value: 'Iran', label: '🇮🇷 Iran' },
                        { value: 'Iraq', label: '🇮🇶 Iraq' }, { value: 'Ireland', label: '🇮🇪 Ireland' },
                        { value: 'Israel', label: '🇮🇱 Israel' }, { value: 'Italy', label: '🇮🇹 Italy' },
                        { value: 'Japan', label: '🇯🇵 Japan' }, { value: 'Jordan', label: '🇯🇴 Jordan' },
                        { value: 'Kenya', label: '🇰🇪 Kenya' }, { value: 'Kuwait', label: '🇰🇼 Kuwait' },
                        { value: 'Malaysia', label: '🇲🇾 Malaysia' }, { value: 'Mexico', label: '🇲🇽 Mexico' },
                        { value: 'Morocco', label: '🇲🇦 Morocco' }, { value: 'Netherlands', label: '🇳🇱 Netherlands' },
                        { value: 'New Zealand', label: '🇳🇿 New Zealand' }, { value: 'Nigeria', label: '🇳🇬 Nigeria' },
                        { value: 'Norway', label: '🇳🇴 Norway' }, { value: 'Pakistan', label: '🇵🇰 Pakistan' },
                        { value: 'Peru', label: '🇵🇪 Peru' }, { value: 'Philippines', label: '🇵🇭 Philippines' },
                        { value: 'Poland', label: '🇵🇱 Poland' }, { value: 'Portugal', label: '🇵🇹 Portugal' },
                        { value: 'Qatar', label: '🇶🇦 Qatar' }, { value: 'Romania', label: '🇷🇴 Romania' },
                        { value: 'Russia', label: '🇷🇺 Russia' }, { value: 'Saudi Arabia', label: '🇸🇦 Saudi Arabia' },
                        { value: 'Singapore', label: '🇸🇬 Singapore' }, { value: 'South Africa', label: '🇿🇦 South Africa' },
                        { value: 'South Korea', label: '🇰🇷 South Korea' }, { value: 'Spain', label: '🇪🇸 Spain' },
                        { value: 'Sri Lanka', label: '🇱🇰 Sri Lanka' }, { value: 'Sweden', label: '🇸🇪 Sweden' },
                        { value: 'Switzerland', label: '🇨🇭 Switzerland' }, { value: 'Taiwan', label: '🇹🇼 Taiwan' },
                        { value: 'Thailand', label: '🇹🇭 Thailand' }, { value: 'Turkey', label: '🇹🇷 Turkey' },
                        { value: 'UAE', label: '🇦🇪 UAE' }, { value: 'Ukraine', label: '🇺🇦 Ukraine' },
                        { value: 'United Kingdom', label: '🇬🇧 United Kingdom' }, { value: 'United States', label: '🇺🇸 United States' },
                        { value: 'Venezuela', label: '🇻🇪 Venezuela' }, { value: 'Vietnam', label: '🇻🇳 Vietnam' },
                      ]}
                      placeholder="Select your country"
                      renderSelected={opt => opt.label}
                      renderOption={opt => <span>{opt.label}</span>}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page 3: Preferences */}
            {currentPage === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div className="ns-label">DEFAULT CURRENCY</div>
                  <CustomDropdown
                    value={formData.defaultCurrency}
                    onChange={v => setFormData(prev => ({ ...prev, defaultCurrency: v }))}
                    options={currencyOptions}
                    placeholder="Select currency"
                    renderSelected={renderCurrencySelected}
                    renderOption={renderCurrencyOption}
                  />
                </div>
                <div>
                  <div className="ns-label">TAX ID / VAT NUMBER</div>
                  <input type="text" name="taxId" value={formData.taxId} onChange={handleInputChange}
                    className="ns-input" placeholder="Optional - for sellers" />
                </div>
                <div>
                  <div className="ns-label">NOTIFICATION PREFERENCES</div>
                  <div className="ns-notif-list">
                    {[
                      { name: 'notifyEveryBid', icon: '🔔', title: 'Notify on every bid', desc: 'Get alerted for each new bid placed.' },
                      { name: 'notifyOutbid', icon: '⚡', title: 'Notify when outbid', desc: 'Know instantly when someone outbids you.' },
                      { name: 'notifyBeforeEnd', icon: '⏰', title: 'Alert 1hr before end', desc: 'Reminder before your auctions close.' },
                    ].map(item => (
                      <label key={item.name} className="ns-notif-row">
                        <div className="ns-notif-left">
                          <div className="ns-notif-icon">{item.icon}</div>
                          <div><div className="ns-notif-title">{item.title}</div><div className="ns-notif-desc">{item.desc}</div></div>
                        </div>
                        <input type="checkbox" name={item.name} checked={formData[item.name]}
                          onChange={handleInputChange} className="ns-toggle" />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="ns-terms-box">
                  <label className="ns-terms-label">
                    <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms}
                      onChange={handleInputChange} required className="ns-terms-check" />
                    <span className="ns-terms-text">
                      I agree to the <a href="#">Terms of Service</a> and{' '}
                      <a href="#">Privacy Policy</a>. I confirm I am 18+ years old.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation — verbatim from original */}
            <div className="ns-nav">
              <button type="button" onClick={prevPage} disabled={currentPage === 0} className="ns-btn-back">
                ← Previous
              </button>
              {currentPage < pages.length - 1 ? (
                <button type="button" onClick={nextPage} className="ns-btn-next">Next →</button>
              ) : (
                <button type="submit" disabled={submitting} className="ns-btn-submit">
                  {submitting ? '⏳ Setting up…' : 'Complete ✓'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuctionFormComplete;