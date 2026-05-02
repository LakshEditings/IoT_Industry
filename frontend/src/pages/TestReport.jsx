import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Brush
} from 'recharts';

const CHANNELS = ['Ch1', 'Ch2', 'Ch3', 'Ch4', 'Ch5', 'Ch6'];
const FROM_OPTS = Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00:00`);
const TO_OPTS   = Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00:00`);

// Sample timeline for sparklines
const sample = (tl, key, n = 80) => {
  const out = [];
  for (let i = 0; i < tl.length; i += n) out.push(tl[i]?.[key] ?? 0);
  return out;
};

/* ── Graph Popup Modal ── */
const GraphModal = ({ paramName, chKeys, timeline, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [activeKeys, setActiveKeys] = useState(chKeys);

  // 6 distinct colors: Blue, Red, Green, Orange, Purple, Teal
  const colors = ['#213555', '#E63946', '#2A9D8F', '#F4A261', '#9D4EDD', '#00B4D8'];

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#213555', margin: 0 }}>
            {paramName} — {chKeys.length > 1 ? 'Combined Graph' : chKeys[0]} (ON / OFF Timeline)
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

        {/* Checkboxes for channels */}
        {chKeys.length > 1 && (
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {chKeys.map((key, i) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: colors[i % colors.length] }}>
                <input 
                  type="checkbox" 
                  checked={activeKeys.includes(key)}
                  onChange={(e) => {
                    if (e.target.checked) setActiveKeys([...activeKeys, key]);
                    else setActiveKeys(activeKeys.filter(k => k !== key));
                  }}
                />
                {key}
              </label>
            ))}
          </div>
        )}

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
                {chKeys.filter(k => activeKeys.includes(k)).map((key) => {
                  const i = chKeys.indexOf(key);
                  return (
                    <Line
                      key={key}
                      name={key}
                      type="stepAfter"
                      dataKey={key}
                      stroke={colors[i % colors.length]}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  );
                })}
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

// Tiny clickable SVG sparkline for multiple channels
const SparkMulti = ({ data, chKeys, onClick }) => {
  if (!data || data.length < 2)
    return <span style={{ color: '#D8C4B6' }}>—</span>;
  const w = 88, h = 30;
  const colors = ['#213555', '#E63946', '#2A9D8F', '#F4A261', '#9D4EDD', '#00B4D8'];
  return (
    <svg
      width={w} height={h}
      style={{ display: 'block', overflow: 'visible', cursor: 'pointer' }}
      onClick={onClick}
    >
      {chKeys.map((key, kIdx) => {
        const pts = data
          .map((row, i) => `${(i / (data.length - 1)) * w},${h - (row[key] || 0) * (h - 2) - 1}`)
          .join(' ');
        return (
          <polyline key={key} points={pts} fill="none" stroke={colors[kIdx % colors.length]} strokeWidth="1.8" />
        );
      })}
    </svg>
  );
};

/* ════════════════════════════════════════ */
const TestReport = () => {
  const { parameters } = useTelemetry();
  const [totals,   setTotals]   = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [date,  setDate]  = useState('2026-04-09');
  const [from, setFrom] = useState('00:00:00');
  const [to,   setTo]   = useState('23:00:00');

  const [isPro, setIsPro] = useState(false);

  // Graph popup state: { paramName, chKeys: [] } | null
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res  = await fetch(
          `http://localhost:5000/api/real-test-data?day=${date}&from=${from}&to=${to}`
        );
        const data = await res.json();
        setTotals(data.totals   || []);
        setTimeline(data.timeline || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [date, from, to]);

  // Sample timeline for multi-sparkline
  const sampledTimeline = sample(timeline, 'Time', 80).map((_, i) => timeline[i * Math.max(1, Math.floor(timeline.length / 80))]);

  const handleDownload = async () => {
    const jsPDF = (await import('jspdf')).default;
    const pdf   = new jsPDF('p', 'mm', 'a4');    // Portrait A4 = 210×297mm
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const m = 10;

    // ── Title block ──
    pdf.setFontSize(18); pdf.setFont(undefined,'bold'); pdf.setTextColor(55,65,81);
    pdf.text('Real Test Data — Telemetry Report' + (isPro ? ' [PRO]' : ''), m, 16);
    pdf.setFontSize(11); pdf.setFont(undefined,'normal'); pdf.setTextColor(108,114,203);
    pdf.text(`Date: ${date}   |   Period: ${from} → ${to}`, m, 25);

    // Portrait A4: 210 - 20mm margin = 190mm usable
    const cols = isPro 
      ? ['#','Parameter','Value','Ch1','Ch2','Ch3','Ch4','Ch5','Ch6', 'Graph']
      : ['#','Parameter','Value','Ch1','Ch2','Ch3','Ch4','Ch5','Ch6'];
    
    // Widths
    const cw = isPro
      ? [6,   32,         14,    17,   17,   17,   17,   17,   17, 36] // total = 190mm
      : [6,   56,         14,    19,   19,   19,   19,   19,   19];    // total = 190mm
    
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
        const isActive = idx === 0; // Only Parameter 1 gets data
        const ent      = totals[i];

        if (isActive && ent) {
          if (isPro) {
            pdf.setFontSize(8); pdf.setFont(undefined,'bold'); pdf.setTextColor(55,65,81);
            pdf.text(`${ent.onCount}times / ${ent.totalSeconds}s`, x + cw[3+i]/2, y + rH/2 - 1, { align: 'center' });
            
            // Draw mini pulse wave under the text
            const sparkData = sample(timeline, CHANNELS[i], 80);
            if (sparkData && sparkData.length >= 2) {
              const w = cw[3+i] - 6; 
              const h = 4; // very small height
              let prevX = x + 3;
              let prevY = y + rH - 2 - (sparkData[0] * h);
              pdf.setDrawColor(62, 88, 121);
              pdf.setLineWidth(0.3);
              for (let pt = 1; pt < sparkData.length; pt++) {
                const curX = x + 3 + (pt / (sparkData.length - 1)) * w;
                const curY = y + rH - 2 - (sparkData[pt] * h);
                pdf.line(prevX, prevY, curX, prevY);
                pdf.line(curX, prevY, curX, curY);
                prevX = curX; prevY = curY;
              }
            }
          } else {
            pdf.setFontSize(9); pdf.setFont(undefined,'bold'); pdf.setTextColor(55,65,81);
            pdf.text(`${ent.totalSeconds} s`, x + cw[3+i]/2, y + rH/2 + 1, { align: 'center' });
          }
        } else {
          pdf.setFontSize(11); pdf.setFont(undefined,'normal'); pdf.setTextColor(215,218,240);
          pdf.text('·', x + cw[3+i]/2, y + rH/2 + 3, { align: 'center' });
        }
        x += cw[3+i];
      });

      // Graph column in PDF
      if (isPro) {
        if (idx === 0 && sampledTimeline.length >= 2) {
          const w = cw[9] - 4; // padding
          const h = rH - 4;
          // Blue, Red, Green, Orange, Purple, Teal
          const colors = [
            [33, 53, 85], [230, 57, 70], [42, 157, 143], 
            [244, 162, 97], [157, 78, 221], [0, 180, 216]
          ];
          
          CHANNELS.forEach((chKey, chIdx) => {
            let prevX = x + 2;
            let prevY = y + rH - 2 - ((sampledTimeline[0]?.[chKey] || 0) * h);
            pdf.setDrawColor(...colors[chIdx]);
            pdf.setLineWidth(0.4);
            for (let k = 1; k < sampledTimeline.length; k++) {
              let currX = x + 2 + (k / (sampledTimeline.length - 1)) * w;
              let currY = y + rH - 2 - ((sampledTimeline[k]?.[chKey] || 0) * h);
              pdf.line(prevX, prevY, currX, currY);
              prevX = currX;
              prevY = currY;
            }
          });
        } else {
          pdf.setFontSize(8); pdf.setFont(undefined,'normal'); pdf.setTextColor(215,218,240);
          pdf.text('—', x + cw[9]/2, y + rH/2 + 3, { align: 'center' });
        }
      }

      y += rH;
    });

    pdf.save(`RealTestReport_${date}_${from.slice(0,5)}-${to.slice(0,5)}.pdf`);
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
          chKeys={popup.chKeys}
          timeline={timeline}
          onClose={() => setPopup(null)}
        />
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Real Test Data Report
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Testing with real Mongo DB records. Toggle PRO for interactive graphs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setIsPro(!isPro)} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: isPro ? '#eab308' : '#e5e7eb',
            color: isPro ? '#fff' : '#4b5563',
            padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem',
            boxShadow: isPro ? '0 4px 14px rgba(234, 179, 8, 0.4)' : 'none',
            transition: 'all 0.2s',
          }}>
            {isPro ? 'PRO ACTIVATED' : 'ACTIVATE PRO'}
          </button>
          <button onClick={handleDownload} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--accent-color)', color: '#fff',
            padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
          }}>
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '2rem', marginBottom: '1.5rem', padding: '1.25rem 1.5rem',
        backgroundColor: 'var(--bg-panel)', borderRadius: '12px',
        border: '1px solid var(--border-color)', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>Date Filter</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            style={selStyle} 
          />
        </div>
        {[
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
          gridTemplateColumns: isPro ? '2.5rem 1fr 4rem repeat(6, 1fr) 6.5rem' : '2.5rem 1fr 4rem repeat(6, 1fr)',
          backgroundColor: '#213555',
          position: 'sticky', top: 0, zIndex: 2,
        }}>
          {(isPro ? ['#', 'Parameter', 'Value', ...CHANNELS, 'Graph'] : ['#', 'Parameter', 'Value', ...CHANNELS]).map(h => (
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

        <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {parameters.map((param, idx) => {
            const isActiveRow = idx === 0;
            return (
              <div key={param.id} style={{
                display: 'grid',
                gridTemplateColumns: isPro ? '2.5rem 1fr 4rem repeat(6, 1fr) 6.5rem' : '2.5rem 1fr 4rem repeat(6, 1fr)',
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
                {/* Ch1–Ch6 */}
                {CHANNELS.map((chKey, i) => {
                  const ent = totals[i];
                  const hasData = isActiveRow && ent;
                  
                  return (
                    <div key={i} 
                      onClick={() => {
                        if (isPro && hasData) setPopup({ paramName: param.name, chKeys: [chKey] });
                      }}
                      style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      padding: '0.25rem', minHeight: '54px',
                      backgroundColor: hasData ? 'rgba(33,53,85,0.04)' : 'transparent',
                      borderLeft: hasData ? '1px solid rgba(33,53,85,0.1)' : '1px solid transparent',
                      cursor: (isPro && hasData) ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                    }}>
                      {hasData ? (
                        isPro ? (
                          <>
                            <span style={{ fontWeight: 700, color: '#3E5879', fontSize: '0.8rem' }}>{ent.onCount}times</span>
                            <span style={{ color: '#D8C4B6', fontSize: '0.7rem', fontWeight: 600 }}>/ {ent.totalSeconds}sec</span>
                          </>
                        ) : (
                          <>
                            <span style={{ fontWeight: 700, color: '#213555', fontSize: '0.75rem' }}>{ent.totalSeconds}s</span>
                            <span style={{ color: '#3E5879', fontSize: '0.68rem' }}>{ent.totalMinutes}m</span>
                          </>
                        )
                      ) : (
                        <span style={{ color: '#D8C4B6', fontSize: '1rem' }}>·</span>
                      )}
                    </div>
                  );
                })}
                
                {/* Multi Graph Column */}
                {isPro && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.25rem' }}>
                    {isActiveRow && sampledTimeline.length > 0 ? (
                      <SparkMulti
                        data={sampledTimeline}
                        chKeys={CHANNELS}
                        onClick={() => setPopup({ paramName: param.name, chKeys: CHANNELS })}
                      />
                    ) : (
                      <span style={{ color: '#D8C4B6' }}>—</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestReport;
