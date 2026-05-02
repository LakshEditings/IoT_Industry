import { useState, useEffect } from 'react';

const Dashboard = () => {
  const [boxes, setBoxes] = useState(Array(6).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setBoxes(prev => prev.map(() => Math.random() > 0.5 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>Live Dashboard Matrix</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem'
      }}>
        {boxes.map((val, idx) => (
          <div key={idx} style={{
            backgroundColor: 'grey', // Primary2 (yellow/orange mapped in theme)
            borderRadius: '16px',
            border: '4px solid var(--accent-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}>
            <span style={{
              fontSize: '4rem',
              fontWeight: '900',
              fontFamily: 'monospace',
              color: 'var(--text-primary)',
              textShadow: '0 0 20px rgba(255,255,255,0.5)'
            }}>
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
