import { useTelemetry } from '../context/TelemetryContext';
import { Download } from 'lucide-react';

const Report = () => {
  const { parameters } = useTelemetry();

  const handleDownload = () => {
    // Generate JSON Object containing current state
    const dataObj = {
      timestamp: new Date().toISOString(),
      recordCount: parameters.length,
      telemetry: parameters
    };
    
    // Create blob and download link
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObj, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "telemetry_report_" + new Date().getTime() + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Live Telemetry Report</h2>
        <button 
          onClick={handleDownload}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'var(--accent-color)', color: 'white',
            padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease'
          }}
        >
          <Download size={18} />
          Export JSON
        </button>
      </div>
      
      <div style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
            
            {/* Displaying the value set in Settings */}
            <div style={{ flex: '1', padding: '0 1rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {param.settingValue || '-- Unconfigured --'}
            </div>

            {/* The 6 Data Status Boxes */}
            <div style={{ flex: '2', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {param.snapshot.map((val, bIdx) => (
                <div key={bIdx} style={{
                  width: '35px',
                  height: '35px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: val !== -1 ? 'var(--success)' : 'transparent',
                  color: val !== -1 ? 'var(--bg-dark)' : 'var(--text-secondary)',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  transition: 'all 0.2s ease'
                }}>
                  {val !== -1 ? val : '_'}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Report;
