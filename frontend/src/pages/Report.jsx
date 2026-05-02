import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Brush
} from 'recharts';

const CHANNELS  = ['Ch1', 'Ch2', 'Ch3', 'Ch4', 'Ch5', 'Ch6'];
const DAYS      = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const FROM_OPTS = ['08:00:00','09:00:00','10:00:00','11:00:00','12:00:00','13:00:00','14:00:00','15:00:00'];
const TO_OPTS   = ['09:00:00','10:00:00','11:00:00','12:00:00','13:00:00','14:00:00','15:00:00','16:00:00'];

const INDIGO  = '#6c72cb';
const INDIGO2 = '#edeefc';   // very light tint for alternate rows

const activeCh = (rowIdx) => rowIdx % 6;

const sample = (tl, key, n = 80) => {
  const out = [];
  for (let i = 0; i < tl.length; i += n) out.push(tl[i]?.[key] ?? 0);
  return out;
};

/* ── Tiny clickable sparkline ── */
const Spark = ({ data, onClick }) => {
  if (!data || data.length < 2)
    return <span style={{ color: '#ccc' }}>—</span>;
  const w = 80, h = 26;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - v * (h - 2) - 1}`)
    .join(' ');
  return (
    <svg width={w} height={h}
      style={{ display:'block', overflow:'visible', cursor:'pointer' }}
      onClick={onClick}>
      <polyline points={pts} fill="none" stroke={INDIGO} strokeWidth="1.8" />
    </svg>
  );
};

/* ── Graph popup ── */
const GraphModal = ({ paramName, chKey, timeline, onClose }) => {
  const [zoom, setZoom] = useState(100);
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:999,
      backgroundColor:'rgba(33,53,85,0.55)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={onClose}>
      <div style={{
        backgroundColor:'#fff', borderRadius:'16px',
        padding:'2rem', width:'80vw', maxWidth:'960px',
        boxShadow:'0 16px 48px rgba(108,114,203,0.25)',
        border:'1px solid #dde0f0',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <h3 style={{ fontSize:'1.2rem', fontWeight:800, color:'#374151', margin:0 }}>
            {paramName} — {chKey}
          </h3>
          <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
            {[['−', () => setZoom(z => Math.max(100,z-50))],['+', () => setZoom(z => z+50)]].map(([lbl,fn]) => (
              <button key={lbl} onClick={fn} style={{
                padding:'0.3rem 0.75rem', borderRadius:'6px',
                border:`1px solid ${INDIGO}`, background:INDIGO2,
                color:INDIGO, cursor:'pointer', fontWeight:700, fontSize:'1rem',
              }}>{lbl}</button>
            ))}
            <button onClick={onClose} style={{
              marginLeft:'0.5rem', padding:'0.3rem 0.5rem',
              border:'none', background:'transparent', cursor:'pointer', color:INDIGO,
            }}><X size={20}/></button>
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <div style={{ width:`${zoom}%`, height:'320px', minWidth:'600px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <XAxis dataKey="Time" tick={{ fill:INDIGO, fontSize:11 }} interval={119}/>
                <YAxis tick={{ fill:INDIGO }} domain={[0,1.2]} ticks={[0,1]}/>
                <Tooltip contentStyle={{ backgroundColor:'#fff', borderColor:'#dde0f0', color:'#374151', borderRadius:'8px', fontSize:'0.8rem' }}/>
                <Line type="stepAfter" dataKey={chKey} stroke={INDIGO} strokeWidth={2} dot={false} isAnimationActive={false}/>
                <Brush dataKey="Time" height={24} stroke={INDIGO} fill={INDIGO2} tickFormatter={() => ''}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════ */
const Report = () => {
  const { parameters } = useTelemetry();
  const [totals,   setTotals]   = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [day,  setDay]  = useState('Monday');
  const [from, setFrom] = useState('08:00:00');
  const [to,   setTo]   = useState('16:00:00');
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

  const sparks = CHANNELS.map(ch => sample(timeline, ch, 80));

  /* ── PDF (portrait A4, purple theme) ── */
  const handleDownload = async () => {
    const jsPDF = (await import('jspdf')).default;
    const pdf   = new jsPDF('p', 'mm', 'a4');
    const H = pdf.internal.pageSize.getHeight();
    const m = 10;

    pdf.setFontSize(18); pdf.setFont(undefined,'bold'); pdf.setTextColor(55,65,81);
    pdf.text('Industrial IoT — Telemetry Report', m, 16);
    pdf.setFontSize(11); pdf.setFont(undefined,'normal'); pdf.setTextColor(108,114,203);
    pdf.text(`Day: ${day}   |   Period: ${from} → ${to}`, m, 25);

    const cols = ['#','Parameter','Value','Ch1','Ch2','Ch3','Ch4','Ch5','Ch6'];
    const cw   = [6, 56, 14, 19, 19, 19, 19, 19, 19];
    const rH   = 14;
    let   y    = 32;
    const totalW = cw.reduce((a,b) => a+b, 0);

    pdf.setFillColor(108,114,203);
    pdf.rect(m, y, totalW, rH, 'F');
    let x = m;
    cols.forEach((c, i) => {
      pdf.setFontSize(9); pdf.setFont(undefined,'bold'); pdf.setTextColor(255,255,255);
      pdf.text(c, i <= 2 ? x+2.5 : x+cw[i]/2-4, y+rH/2+3);
      x += cw[i];
    });
    y += rH;

    parameters.forEach((param, idx) => {
      if (y + rH > H - m) { pdf.addPage(); y = m; }
      const ci = activeCh(idx);
      const bg = idx % 2 === 0 ? [255,255,255] : [245,246,255];
      pdf.setFillColor(...bg);
      pdf.rect(m, y, totalW, rH, 'F');
      pdf.setDrawColor(225,225,240); pdf.setLineWidth(0.2);
      pdf.line(m, y+rH, m+totalW, y+rH);
      x = m;
      pdf.setFontSize(8); pdf.setFont(undefined,'normal'); pdf.setTextColor(176,184,208);
      pdf.text(String(idx+1), x+2.5, y+rH/2+3); x += cw[0];
      pdf.setFontSize(9); pdf.setFont(undefined,'normal'); pdf.setTextColor(55,65,81);
      pdf.text(param.name, x+2.5, y+rH/2+3); x += cw[1];
      pdf.setFontSize(8); pdf.setFont(undefined,'normal'); pdf.setTextColor(156,163,175);
      pdf.text(param.settingValue||'—', x+2.5, y+rH/2+3); x += cw[2];
      CHANNELS.forEach((_,i) => {
        const isActive = i===ci; const ent = totals[i];
        if (isActive && ent) {
          pdf.setFontSize(9); pdf.setFont(undefined,'bold'); pdf.setTextColor(55,65,81);
          pdf.text(`${ent.totalSeconds} s`, x+2.5, y+rH/2+1);
          pdf.setFontSize(7); pdf.setFont(undefined,'normal'); pdf.setTextColor(108,114,203);
          pdf.text(`${ent.totalMinutes} min`, x+2.5, y+rH/2+6);
        } else {
          pdf.setFontSize(11); pdf.setFont(undefined,'normal'); pdf.setTextColor(215,218,240);
          pdf.text('·', x+cw[3+i]/2-1.5, y+rH/2+3);
        }
        x += cw[3+i];
      });
      y += rH;
    });
    pdf.save(`Report_${day}_${from.slice(0,5)}-${to.slice(0,5)}.pdf`);
  };

  const selStyle = {
    padding:'0.55rem 0.75rem', borderRadius:'8px',
    background:'#ffffff', color:'#374151',
    border:`1px solid ${INDIGO}`, outline:'none',
    cursor:'pointer', fontFamily:'inherit', fontSize:'0.88rem',
  };

  const COL_TEMPLATE = '2.5rem 1fr 4rem repeat(6,1fr)';

  return (
    <div style={{ padding:'2rem' }}>

      {popup && (
        <GraphModal paramName={popup.paramName} chKey={popup.chKey}
          timeline={timeline} onClose={() => setPopup(null)}/>
      )}

      {/* Page Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
        <div>
          <h2 style={{ fontSize:'1.75rem', fontWeight:800, color:'#374151', marginBottom:'0.25rem' }}>
            Live Telemetry Report
          </h2>
          <p style={{ color:'#9ca3af', fontSize:'0.875rem' }}>
            42 parameters · 6 channels · diagonal activity · click graph to inspect
          </p>
        </div>
        <button onClick={handleDownload} style={{
          display:'flex', alignItems:'center', gap:'0.5rem',
          background:INDIGO, color:'#fff',
          padding:'0.75rem 1.5rem', borderRadius:'8px', border:'none',
          cursor:'pointer', fontWeight:700, fontSize:'0.9rem',
          boxShadow:'0 4px 14px rgba(108,114,203,0.4)',
        }}>
          <Download size={16}/> Download PDF
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display:'flex', gap:'2rem', marginBottom:'1.5rem',
        padding:'1.25rem 1.5rem', backgroundColor:'#ffffff',
        borderRadius:'12px', border:`1px solid ${INDIGO}22`,
        boxShadow:'0 2px 12px rgba(108,114,203,0.08)',
        alignItems:'center', flexWrap:'wrap',
      }}>
        {[
          { label:'Day Filter', value:day,  set:setDay,  opts:DAYS      },
          { label:'From Time',  value:from, set:setFrom, opts:FROM_OPTS },
          { label:'To Time',    value:to,   set:setTo,   opts:TO_OPTS   },
        ].map(({ label, value, set, opts }) => (
          <div key={label} style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
            <label style={{ color:INDIGO, fontSize:'0.78rem', fontWeight:700, letterSpacing:'0.03em' }}>{label}</label>
            <select value={value} onChange={e => set(e.target.value)} style={selStyle}>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        {loading && <span style={{ color:INDIGO, fontSize:'0.85rem' }}>⏳ Loading…</span>}
      </div>

      {/* Table — purple theme matching PDF */}
      <div style={{
        backgroundColor:'#ffffff', borderRadius:'16px',
        boxShadow:'0 4px 32px rgba(108,114,203,0.12)', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{
          display:'grid', gridTemplateColumns: COL_TEMPLATE,
          backgroundColor: INDIGO, position:'sticky', top:0, zIndex:2,
        }}>
          {['#','Parameter','Value',...CHANNELS].map((h, i) => (
            <div key={h} style={{
              padding:'0.9rem 0.75rem', fontWeight:700, fontSize:'0.78rem',
              color:'#ffffff', letterSpacing:'0.04em',
              textAlign: i <= 2 ? 'left' : 'center',
            }}>{h}</div>
          ))}
        </div>

        {/* Body */}
        <div style={{ maxHeight:'65vh', overflowY:'auto' }}>
          {parameters.map((param, idx) => {
            const ci    = activeCh(idx);
            const chKey = CHANNELS[ci];
            const ent   = totals[ci];
            const evenBg = '#ffffff', oddBg = '#f5f6ff';
            return (
              <div key={param.id}
                style={{
                  display:'grid', gridTemplateColumns: COL_TEMPLATE,
                  backgroundColor: idx%2===0 ? evenBg : oddBg,
                  borderBottom:'1px solid #ebebf5',
                  alignItems:'center', minHeight:'52px',
                  transition:'background-color 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor='#ededfa'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor=idx%2===0?evenBg:oddBg}
              >
                {/* # */}
                <div style={{ textAlign:'center', color:'#b0b8d0', fontSize:'0.72rem', fontWeight:500 }}>
                  {idx+1}
                </div>
                {/* Parameter */}
                <div style={{ padding:'0.5rem 0.75rem', fontWeight:500, color:'#374151', fontSize:'0.875rem' }}>
                  {param.name}
                </div>
                {/* Value */}
                <div style={{ color:'#9ca3af', fontSize:'0.78rem' }}>
                  {param.settingValue||'—'}
                </div>
                {/* Ch1–Ch6 */}
                {CHANNELS.map((_,i) => {
                  const active = i===ci;
                  return (
                    <div key={i} style={{
                      display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center',
                      minHeight:'52px',
                      borderLeft: active ? `3px solid ${INDIGO}` : '3px solid transparent',
                    }}>
                      {active && ent ? (
                        <>
                          <span style={{ fontWeight:700, color:'#374151', fontSize:'0.8rem' }}>{ent.totalSeconds}s</span>
                          <span style={{ color:INDIGO, fontSize:'0.68rem', marginTop:'2px' }}>{ent.totalMinutes}m</span>
                        </>
                      ) : (
                        <span style={{ color:'#dde0f0', fontSize:'1.2rem' }}>·</span>
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

export default Report;
