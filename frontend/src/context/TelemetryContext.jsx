import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const TelemetryContext = createContext();

const parameterNames = [
  "Gravity", "Force", "Pressure", "Acceleration", "Velocity", "Temperature", "Humidity", "Torque", 
  "Voltage", "Current", "Resistance", "Magnetic Field", "Capacitance", "Inductance", "Frequency",
  "Amplitude", "Flow Rate", "Vibration", "Displacement", "Strain", "pH Level", "Gas Concentration",
  "Radiation", "Luminosity", "Acoustic Pressure", "Mass", "Density", "Viscosity", "Conductivity",
  "Turbidity", "RPM", "Load", "Oxygen Level", "Salinity", "Oxidation", "Altitude", "Latitude",
  "Longitude", "Gyro X", "Gyro Y", "Gyro Z", "Power Factor"
];

export const TelemetryProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [parameters, setParameters] = useState(() => {
    return parameterNames.map((name, index) => ({
      id: index,
      name,
      settingValue: '', // User configured string
      snapshot: [-1,-1,-1,-1,-1,-1], // The 6 boxes representing live states
      timings: [0,0,0,0,0,0] // The cumulative active seconds per box
    }));
  });

  const updateSetting = (id, value) => {
    setParameters(prev => prev.map(p => p.id === id ? { ...p, settingValue: value } : p));
  };

  // The 5-second random injection loop for Report page visualization
  // Even though it's visualized in Report, tracking it here means they all stay in sync
  useEffect(() => {
    const simInterval = setInterval(() => {
      setParameters(prev => prev.map(p => {
        const newSnapshot = [-1,-1,-1,-1,-1,-1];
        const randomActiveIndex = Math.floor(Math.random() * 6);
        // Randomly 0 or 1 at that active index
        newSnapshot[randomActiveIndex] = Math.random() > 0.5 ? 1 : 0;
        
        const newTimings = [...(p.timings || [0,0,0,0,0,0])];
        newTimings[randomActiveIndex] += 5;

        return { ...p, snapshot: newSnapshot, timings: newTimings };
      }));
    }, 5000); // 5 seconds

    return () => clearInterval(simInterval);
  }, []);

  // The 5-second Telemetry & Timing save loop to Backend
  useEffect(() => {
    if (!user) return; // Only save if logged in

    const saveInterval = setInterval(async () => {
      try {
        const payload = {
          operatorId: user.id || user._id || 'unknown',
          operatorEmail: user.email,
          parameters
        };

        const resTelemetry = await fetch('http://localhost:5000/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resTiming = await fetch('http://localhost:5000/api/telemetry-timing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (resTelemetry.ok && resTiming.ok) {
          console.log(`[SYS] Telemetry & Timings synced at ${new Date().toLocaleTimeString()}`);
        } else {
          console.error('[SYS] Telemetry sync failed.');
        }

      } catch (e) {
        console.error('[SYS] Database offline. Could not write telemetry.');
      }
    }, 5000); // 5 seconds

    return () => clearInterval(saveInterval);
  }, [user, parameters]);

  return (
    <TelemetryContext.Provider value={{ parameters, updateSetting }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => useContext(TelemetryContext);
