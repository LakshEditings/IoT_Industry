import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Brush
} from 'recharts';

const CHANNELS = ['Ch1', 'Ch2', 'Ch3', 'Ch4', 'Ch5', 'Ch6'];
const DAYS     = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const FROM_OPTS = ['08:00:00','09:00:00','10:00:00','11:00:00','12:00:00','13:00:00','14:00:00','15:00:00'];
const TO_OPTS   = ['09:00:00','10:00:00','11:00:00','12:00:00','13:00:00','14:00:00','15:00:00','16:00:00'];

const activeCh = (rowIdx) => rowIdx % 6;

// Sample timeline for sparklines
const sample = (tl, key, n = 80) => {
  const out = [];
  for (let i = 0; i < tl.length; i += n) out.push(tl[i]?.[key] ?? 0);
  return out;
};

// Tiny clickable SVG sparkline
const Spark = ({ data, onClick }) => {
  if (!data || data.length < 2)
    return <span style={{ color: '#D8C4B6' }}>—</span>;
  const w = 88, h = 30;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - v * (h - 2) - 1}`)
    .join(' ');
  return (
    <svg
      width={w} height={h}
      style={{ display: 'block', overflow: 'visible', cursor: 'pointer' }}
      onClick={onClick}
    >
      <polyline points={pts} fill="none" stroke="#3E5879" strokeWidth="1.8" />
    </svg>
  );
};

/* ── Graph Popup Modal ── */
const GraphModal = ({ paramName, chKey, timeline, onClose }) => {
  const [zoom, setZoom] = useState(100);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      backgroundColor: 'rgba(33,53,85,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          backgroundColor: '#fff', borderRadius: '16px',
          border: '1px solid var(--border-color)',
          padding: '2rem', width: '80vw', maxWidth: '960px',
          boxShadow: '0 16px 48px rgba(33,53,85,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#213555', margin: 0 }}>
            {paramName} — {chKey} (ON / OFF Timeline)
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setZoom(z => Math.max(100, z - 50))}
              style={{ padding: '0.3rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#F5EFE7', color: '#213555', cursor: 'pointer', fontWeight: 700 }}>
              −
            </button>
            <button onClick={() => setZoom(z => z + 50)}
              style={{ padding: '0.3rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#F5EFE7', color: '#213555', cursor: 'pointer', fontWeight: 700 }}>
              +
            </button>
            <button onClick={onClose}
              style={{ marginLeft: '1rem', padding: '0.3rem 0.5rem', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#3E5879' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable, zoomable chart */}
        <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ width: `${zoom}%`, height: '320px', minWidth: '600px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <XAxis
                  dataKey="Time"
                  tick={{ fill: '#3E5879', fontSize: 11 }}
                  interval={119}
                />
                <YAxis
                  tick={{ fill: '#3E5879' }}
                  domain={[0, 1.2]}
                  ticks={[0, 1]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff', borderColor: '#D8C4B6',
                    color: '#213555', borderRadius: '8px', fontSize: '0.8rem'
                  }}
                />
                <Line
                  type="stepAfter"
                  dataKey={chKey}
                  stroke="#213555"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Brush
                  dataKey="Time"
                  height={24}
                  stroke="#3E5879"
                  fill="#F5EFE7"
                  tickFormatter={() => ''}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════ */
const ReportsPro = () => {
  const { parameters } = useTelemetry();
  const [totals,   setTotals]   = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [day,  setDay]  = useState('Monday');
  const [from, setFrom] = useState('08:00:00');
  const [to,   setTo]   = useState('16:00:00');

  // Graph popup state: { paramName, chKey } | null
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res  = await fetch(
          `http://localhost:5000/api/single-component-check?day=${day}&from=${from}&to=${to}`
        );
        const data = await res.json();
        setTotals(data.totals   || []);
        setTimeline(data.timeline || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [day, from, to]);

  const sparks = CHANNELS.map((ch) => sample(timeline, ch, 80));

  const handleDownload = async () => {
    const jsPDF = (await import('jspdf')).default;
    const pdf   = new jsPDF('p', 'mm', 'a4');    // Portrait A4 = 210×297mm
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const m = 10;

    // ── Title block ──
    pdf.setFontSize(18); pdf.setFont(undefined,'bold'); pdf.setTextColor(55,65,81);
    pdf.text('Industrial IoT — Telemetry Report', m, 16);
    pdf.setFontSize(11); pdf.setFont(undefined,'normal'); pdf.setTextColor(108,114,203);
    pdf.text(`Day: ${day}   |   Period: ${from} → ${to}`, m, 25);

    // Portrait A4: 210 - 20mm margin = 190mm usable
    // # | Parameter | Value | Ch1 | Ch2 | Ch3 | Ch4 | Ch5 | Ch6
    //  6     56        14     19    19    19    19    19    19   = 190mm ✓
    const cols = ['#','Parameter','Value','Ch1','Ch2','Ch3','Ch4','Ch5','Ch6'];
    const cw   = [6,   32,         14,    19,   19,   19,   19,   19,   19];
    const rH   = 12;
    let   y    = 32;
    const totalW = cw.reduce((a,b) => a+b, 0);

    // ── Header ──
    pdf.setFillColor(108,114,203);
    pdf.rect(m, y, totalW, rH, 'F');
    let x = m;
    cols.forEach((c, i) => {
      pdf.setFontSize(9); pdf.setFont(undefined,'bold'); pdf.setTextColor(255,255,255);
      pdf.text(c, i <= 2 ? x + 2.5 : x + cw[i]/2 - 4, y + rH/2 + 3);
      x += cw[i];
    });
    y += rH;

    // ── Data rows ──
    parameters.forEach((param, idx) => {
      if (y + rH > H - m) { pdf.addPage(); y = m; }

      const ci  = activeCh(idx);
      const bg  = idx % 2 === 0 ? [255,255,255] : [245,246,255];

      pdf.setFillColor(...bg);
      pdf.rect(m, y, totalW, rH, 'F');
      pdf.setDrawColor(225,225,240); pdf.setLineWidth(0.2);
      pdf.line(m, y + rH, m + totalW, y + rH);

      x = m;

      // #
      pdf.setFontSize(8); pdf.setFont(undefined,'normal'); pdf.setTextColor(176,184,208);
      pdf.text(String(idx+1), x + 2.5, y + rH/2 + 3);
      x += cw[0];

      // Parameter name
      pdf.setFontSize(9); pdf.setFont(undefined,'normal'); pdf.setTextColor(55,65,81);
      pdf.text(param.name, x + 2.5, y + rH/2 + 3);
      x += cw[1];

      // Value
      pdf.setFontSize(8); pdf.setFont(undefined,'normal'); pdf.setTextColor(156,163,175);
      pdf.text(param.settingValue || '—', x + 2.5, y + rH/2 + 3);
      x += cw[2];

      // Ch1–Ch6
      CHANNELS.forEach((_, i) => {
        const isActive = i === ci;
        const ent      = totals[i];

        if (isActive && ent) {
          // Seconds — bold dark
          pdf.setFontSize(9); pdf.setFont(undefined,'bold'); pdf.setTextColor(55,65,81);
          pdf.text(`${ent.totalSeconds} s`, x + 2.5, y + rH/2 + 1);
          // Minutes — indigo
          pdf.setFontSize(7); pdf.setFont(undefined,'normal'); pdf.setTextColor(108,114,203);
        //  pdf.text(`${ent.totalMinutes} min`, x + 2.5, y + rH/2 + 6);
        } else {
          // Dot
          pdf.setFontSize(11); pdf.setFont(undefined,'normal'); pdf.setTextColor(215,218,240);
          pdf.text('·', x + cw[3+i]/2 - 1.5, y + rH/2 + 3);
        }
        x += cw[3+i];
      });

      y += rH;
    });

    pdf.save(`Report_${day}_${from.slice(0,5)}-${to.slice(0,5)}.pdf`);
  };



  /* ── Shared styles ── */
  const thStyle = {
    padding: '0.7rem 0.5rem', fontWeight: 700, fontSize: '0.72rem',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: '#F5EFE7', textAlign: 'center',
    borderRight: '1px solid rgba(255,255,255,0.08)',
  };
  const selStyle = {
    padding: '0.6rem 0.75rem', borderRadius: '8px',
    background: '#F5EFE7', color: 'var(--text-primary)',
    border: '1px solid var(--border-color)', outline: 'none',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem',
  };

  return (
    <div style={{ padding: '2rem' }}>

      {/* Graph Popup */}
      {popup && (
        <GraphModal
          paramName={popup.paramName}
          chKey={popup.chKey}
          timeline={timeline}
          onClose={() => setPopup(null)}
        />
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Live Telemetry Report
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            42 parameters · 6 channels · diagonal activity · click Graph to inspect
          </p>
        </div>
        <button onClick={handleDownload} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--accent-color)', color: '#fff',
          padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
          cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
        }}>
          <Download size={16} /> Download PDF
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '2rem', marginBottom: '1.5rem', padding: '1.25rem 1.5rem',
        backgroundColor: 'var(--bg-panel)', borderRadius: '12px',
        border: '1px solid var(--border-color)', alignItems: 'center', flexWrap: 'wrap',
      }}>
        {[
          { label: 'Day Filter',  value: day,  set: setDay,  opts: DAYS      },
          { label: 'From Time',   value: from, set: setFrom, opts: FROM_OPTS },
          { label: 'To Time',     value: to,   set: setTo,   opts: TO_OPTS   },
        ].map(({ label, value, set, opts }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>{label}</label>
            <select value={value} onChange={e => set(e.target.value)} style={selStyle}>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        {loading && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>⏳ Loading…</span>}
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(33,53,85,0.08)',
        overflow: 'hidden',
      }}>
        {/* ── Column Header ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.5rem 1fr 4rem repeat(6, 1fr)',
          backgroundColor: '#213555',
          position: 'sticky', top: 0, zIndex: 2,
        }}>
          {['#', 'Parameter', 'Value', ...CHANNELS].map(h => (
            <div key={h} style={{
              padding: '0.75rem 0.5rem',
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#F5EFE7',
              textAlign: 'center',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}>{h}</div>
          ))}
        </div>

        {/* ── Body ── */}
        <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {parameters.map((param, idx) => {
            const ci    = activeCh(idx);
            const chKey = CHANNELS[ci];
            const ent   = totals[ci];
            return (
              <div key={param.id} style={{
                display: 'grid',
                gridTemplateColumns: '2.5rem 1fr 4rem repeat(6, 1fr)',
                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#faf7f4',
                borderBottom: '1px solid var(--border-color)',
                alignItems: 'center',
                minHeight: '54px',
              }}>
                {/* # */}
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600 }}>
                  {idx + 1}
                </div>
                {/* Name */}
                <div style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {param.name}
                </div>
                {/* Value */}
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  {param.settingValue || '—'}
                </div>
                {/* Ch1–Ch6 diagonal */}
                {CHANNELS.map((_, i) => {
                  const active = i === ci;
                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      padding: '0.25rem', minHeight: '54px',
                      backgroundColor: active ? 'rgba(33,53,85,0.06)' : 'transparent',
                      borderLeft: active ? '3px solid #3E5879' : '3px solid transparent',
                    }}>
                      {active && ent ? (
                        <>
                          <span style={{ fontWeight: 700, color: '#213555', fontSize: '0.75rem' }}>{ent.totalSeconds}s</span>
                          <span style={{ color: '#3E5879', fontSize: '0.68rem' }}>{ent.totalMinutes}m</span>
                        </>
                      ) : (
                        <span style={{ color: '#D8C4B6', fontSize: '1rem' }}>·</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
};

export default ReportsPro;
