import { useTelemetry } from '../context/TelemetryContext';

const Settings = () => {
  const { parameters, updateSetting } = useTelemetry();

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>Parameter Configuration</h2>
      
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
    </div>
  );
};

export default Settings;
