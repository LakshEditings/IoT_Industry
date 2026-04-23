import { useTelemetry } from '../context/TelemetryContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Clock, Download, X } from 'lucide-react';

const Settings = () => {
  const { parameters, updateSetting } = useTelemetry();
  const { user } = useAuth();
  
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [modalData, setModalData] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchHistoricalData = async () => {
    if (!minDate || !maxDate) return alert('Please select both Min and Max times.');
    setIsFetching(true);
    try {
      const operatorId = user.id || user._id || 'unknown';
      const res = await fetch(`http://localhost:5000/api/telemetry/export?min=${minDate}&max=${maxDate}&operatorId=${operatorId}`);
      const data = await res.json();
      setModalData(data);
    } catch (e) {
      console.error(e);
      alert('Failed to fetch historical data.');
    } finally {
      setIsFetching(false);
    }
  };

  const downloadModalData = () => {
    if (!modalData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(modalData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `historical_telemetry_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>Parameter Configuration</h2>
      
      <div style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem'
      }}>
        {parameters.map((param, idx) => (
          <div key={param.id} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '1rem 0',
            borderBottom: idx === parameters.length - 1 ? 'none' : '1px solid var(--border-color)'
          }}>
            <div style={{ width: '40px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
              {idx + 1})
            </div>
            <div style={{ flex: '1', fontWeight: '500', color: 'var(--text-primary)' }}>
              {param.name}
            </div>
            <div style={{ flex: '2', display: 'flex', justifyContent: 'flex-end' }}>
              <input
                type="text"
                value={param.settingValue}
                onChange={(e) => updateSetting(param.id, e.target.value)}
                placeholder="Enter value..."
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  padding: '0.8rem 1rem',
                  backgroundColor: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Historical Data Extraction Module */}
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>Historical Data Extraction</h2>
      <div style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Min Time (Start)</label>
          <input 
            type="datetime-local" 
            value={minDate} 
            onChange={e => setMinDate(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'white' }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Max Time (End)</label>
          <input 
            type="datetime-local" 
            value={maxDate} 
            onChange={e => setMaxDate(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'white' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
          <button 
            onClick={fetchHistoricalData}
            disabled={isFetching}
            style={{
              padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none',
              backgroundColor: 'var(--accent-color)', color: 'white', fontWeight: 'bold',
              cursor: isFetching ? 'not-allowed' : 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center',
              marginTop: '1.5rem'
            }}
          >
            <Clock size={18} />
            {isFetching ? 'Scanning...' : 'Fetch History'}
          </button>
        </div>
      </div>

      {/* Data Preview Modal */}
      {modalData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-panel)', width: '100%', maxWidth: '800px',
            maxHeight: '80vh', borderRadius: '12px', border: '1px solid var(--border-color)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Query Results ({modalData.recordCount} Records Found)</h3>
              <button onClick={() => setModalData(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: '1', backgroundColor: '#0f172a' }}>
              <pre style={{ color: '#a5b4fc', fontSize: '0.85rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(modalData, null, 2)}
              </pre>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={downloadModalData}
                style={{
                  padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none',
                  backgroundColor: 'var(--success)', color: 'white', fontWeight: 'bold',
                  cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center'
                }}
              >
                <Download size={18} />
                Download JSON Payload
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
