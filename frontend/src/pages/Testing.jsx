import { useState, useEffect } from 'react';
import { Activity, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from 'recharts';

const Testing = () => {
  const [channels, setChannels] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('Ch1');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [filterDay, setFilterDay] = useState('Monday');
  const [filterFrom, setFilterFrom] = useState('08:00:00');
  const [filterTo, setFilterTo] = useState('16:00:00');

  useEffect(() => {
    const fetchTestingData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/single-component-check?day=${filterDay}&from=${filterFrom}&to=${filterTo}`);
        const data = await res.json();
        setChannels(data.totals || []);
        setTimeline(data.timeline || []);
      } catch (error) {
        console.error('Failed to fetch testing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTestingData();
  }, [filterDay, filterFrom, filterTo]);

  const old_handleDownloadPDF = async () => {
    // Dynamic imports so we don't break the initial bundle size
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;
    
    const element = document.getElementById('graph-screenshot-area');
    if (!element) return;
    
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#1a1d21' });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Header
    pdf.setFontSize(18);
    pdf.text(`Component Report: ${selectedChannel}`, 10, 20);
    pdf.setFontSize(12);
    pdf.text(`Day: ${filterDay} | From: ${filterFrom} To: ${filterTo}`, 10, 28);
    
    // Add Graph Screenshot
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * (pdfWidth - 20)) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 10, 35, pdfWidth - 20, imgHeight);
    
    let currentY = 35 + imgHeight + 15;
    
    // Append ON Timestamps
    pdf.setFontSize(14);
    pdf.text(`Active Timestamps (ON) for ${selectedChannel}:`, 10, currentY);
    currentY += 10;
    
    pdf.setFontSize(10);
    const activeTimestamps = timeline.filter(t => t[selectedChannel] === 1);
    
    if (activeTimestamps.length === 0) {
      pdf.text("No active timestamps found in this period.", 10, currentY);
    } else {
      let xOffset = 10;
      activeTimestamps.forEach((t) => {
        if (currentY > pdfHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
        
        pdf.text(t.Time, xOffset, currentY);
        xOffset += 35; // Column width
        
        if (xOffset > pdfWidth - 30) {
          xOffset = 10;
          currentY += 8; // Row height
        }
      });
    }
    
    pdf.save(`${selectedChannel}_Report_${filterDay}.pdf`);
  };

  const handleDownloadPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;
    
    // Create Landscape PDF for maximum graph width
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // ==========================================
    // PAGE 1: Summary Table
    // ==========================================
    pdf.setFontSize(22);
    pdf.text(`Industrial IoT Report`, 14, 25);
    
    pdf.setFontSize(14);
    pdf.text(`Day: ${filterDay} | From: ${filterFrom} To: ${filterTo}`, 14, 35);
    
    pdf.setFontSize(16);
    pdf.text(`Component Summary`, 14, 55);
    
    // Draw Table Headers
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text("Channel", 20, 70);
    pdf.text("Time in sec", 80, 70);
    pdf.text("Time in min", 140, 70);
    
    // Draw Line under header
    pdf.line(14, 75, 200, 75);
    
    pdf.setFont(undefined, 'normal');
    let yPos = 85;
    channels.forEach((ch) => {
      pdf.text(String(ch.channel), 20, yPos);
      pdf.text(String(ch.totalSeconds) + " s", 80, yPos);
      pdf.text(String(ch.totalMinutes) + " m", 140, yPos);
      yPos += 15;
    });

    // ==========================================
    // PAGE 2: Unzoomed Graph
    // ==========================================
    pdf.addPage();
    
    // Capture the HIDDEN unzoomed graph
    const element = document.getElementById('hidden-export-graph');
    if (element) {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#1a1d21' });
      const imgData = canvas.toDataURL('image/png');
      
      const imgProps = pdf.getImageProperties(imgData);
      
      // Maximize width to the PDF sheet with a small 10mm margin
      const margin = 10;
      const targetWidth = pdfWidth - (margin * 2); 
      const targetHeight = (imgProps.height * targetWidth) / imgProps.width;
      
      // Title for page 2
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${selectedChannel} Timeline (Unzoomed)`, margin, 20);
      
      // Draw image
      pdf.addImage(imgData, 'PNG', margin, 30, targetWidth, targetHeight);
    }
    
    pdf.save(`Executive_Report_${filterDay}.pdf`);
  };


  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 'bold' }}>Single Component Check</h2>
      
      {/* Control Panel */}
      <div style={{
        display: 'flex', gap: '2rem', marginBottom: '2rem', padding: '1.5rem', 
        backgroundColor: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-color)',
        alignItems: 'center', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 'bold' }}>Day Filter</label>
          <select 
            value={filterDay} 
            onChange={e => setFilterDay(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none', cursor: 'pointer' }}
          >
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 'bold' }}>From Time</label>
          <select 
            value={filterFrom} 
            onChange={e => setFilterFrom(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none', cursor: 'pointer' }}
          >
            {['08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 'bold' }}>To Time</label>
          <select 
            value={filterTo} 
            onChange={e => setFilterTo(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none', cursor: 'pointer' }}
          >
            {['09:00:00', '10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Calculating mathematical totals...</div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
          
          {/* 3x2 Grid Section */}
          <div style={{
            flex: '2 1 600px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem'
          }}>
            {channels.map((ch, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedChannel(ch.channel)}
                style={{
                  backgroundColor: selectedChannel === ch.channel ? 'var(--bg-dark)' : 'var(--bg-panel)',
                  borderRadius: '16px',
                  border: selectedChannel === ch.channel ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                  padding: '2rem',
                  boxShadow: selectedChannel === ch.channel ? '0 0 15px rgba(217, 119, 87, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  transform: selectedChannel === ch.channel ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--accent-color)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{ch.channel}</h3>
                  <Activity size={24} color="var(--accent-color)" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Seconds ON:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{ch.totalSeconds} s</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Minutes ON:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-hover)' }}>{ch.totalMinutes} m</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Graph Section */}
          <div 
            id="graph-screenshot-area"
            style={{
            flex: '1 1 350px',
            backgroundColor: 'var(--bg-panel)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 'bold', margin: 0 }}>
                {selectedChannel} (ON/OFF)
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handleDownloadPDF}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem 0.75rem', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                >
                  <Download size={16} /> PDF
                </button>
                <button 
                  onClick={() => setZoomLevel(z => Math.max(100, z - 50))} 
                  style={{ cursor: 'pointer', padding: '0.25rem 0.75rem', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                >
                  -
                </button>
                <button 
                  onClick={() => setZoomLevel(z => z + 50)} 
                  style={{ cursor: 'pointer', padding: '0.25rem 0.75rem', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                >
                  +
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, minHeight: '350px', overflowX: 'auto', overflowY: 'hidden' }}>
              <div style={{ width: `${zoomLevel}%`, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <XAxis 
                    dataKey="Time" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                    interval={119}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--text-secondary)' }} 
                    domain={[0, 1.2]} 
                    ticks={[0, 1]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }} 
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey={selectedChannel}
                    stroke="#D97757" 
                    strokeWidth={2} 
                    dot={false} 
                    isAnimationActive={false}
                  />
                  <Brush 
                    dataKey="Time" 
                    height={30} 
                    stroke="var(--accent-color)" 
                    fill="var(--bg-dark)"
                    tickFormatter={() => ''}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            </div>
          </div>

        </div>
      )}

      {/* HIDDEN OFF-SCREEN GRAPH FOR PDF EXPORT */}
      <div 
        id="hidden-export-graph" 
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '2000px', // Massive width for high-res unzoomed capture
          height: '600px',
          backgroundColor: '#1a1d21',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <h3 style={{ fontSize: '2rem', color: '#fff', fontWeight: 'bold', marginBottom: '2rem' }}>
          {selectedChannel} (Full 8-Hour Timeline)
        </h3>
        <div style={{ flex: 1, width: '100%', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <XAxis 
                dataKey="Time" 
                tick={{ fill: '#a0aabf', fontSize: 16 }} 
                interval={119} // 10 minute ticks
              />
              <YAxis 
                tick={{ fill: '#a0aabf', fontSize: 16 }} 
                domain={[0, 1.2]} 
                ticks={[0, 1]}
              />
              <Line 
                type="stepAfter" 
                dataKey={selectedChannel}
                stroke="#D97757" 
                strokeWidth={4} 
                dot={false} 
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Testing;
