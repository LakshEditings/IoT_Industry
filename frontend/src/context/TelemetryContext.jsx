import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const TelemetryContext = createContext();

const API = 'http://localhost:5000';

const parameterNames = [
  "Gravity", "Force", "Pressure", "Acceleration", "Velocity", "Temperature", "Humidity", "Torque",
  "Voltage", "Current", "Resistance", "Magnetic Field", "Capacitance", "Inductance", "Frequency",
  "Amplitude", "Flow Rate", "Vibration", "Displacement", "Strain", "pH Level", "Gas Concentration",
  "Radiation", "Luminosity", "Acoustic Pressure", "Mass", "Density", "Viscosity", "Conductivity",
  "Turbidity", "RPM", "Load", "Oxygen Level", "Salinity", "Oxidation", "Altitude", "Latitude",
  "Longitude", "Gyro X", "Gyro Y", "Gyro Z", "Power Factor"
];

const defaultParameters = () =>
  parameterNames.map((name, index) => ({
    id: index,
    name,
    settingValue: '',
    snapshot: [-1, -1, -1, -1, -1, -1],
    timings:  [0, 0, 0, 0, 0, 0],
  }));

export const TelemetryProvider = ({ children }) => {
  const { user } = useAuth();
  const [parameters,    setParameters]    = useState(defaultParameters);
  const [settingsReady, setSettingsReady] = useState(false);

  /* ── Load persisted settings from MongoDB on mount ── */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res  = await fetch(`${API}/api/parameter-settings`);
        const saved = await res.json();           // array of { parameterId, name, value, updatedAt }

        if (Array.isArray(saved) && saved.length > 0) {
          const map = {};
          saved.forEach(s => { map[s.parameterId] = s.value; });

          setParameters(prev =>
            prev.map(p => ({
              ...p,
              settingValue: map[p.id] !== undefined ? map[p.id] : p.settingValue,
            }))
          );
        }
      } catch (e) {
        console.warn('[Settings] Could not load parameter settings from DB:', e.message);
      } finally {
        setSettingsReady(true);
      }
    };
    fetchSettings();
  }, []);

  /* ── Save a single parameter value to MongoDB immediately on change ── */
  const updateSetting = useCallback(async (id, value) => {
    // Optimistic local update
    setParameters(prev =>
      prev.map(p => p.id === id ? { ...p, settingValue: value } : p)
    );

    // Persist to MongoDB
    try {
      const param = parameterNames[id];
      await fetch(`${API}/api/parameter-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameterId: id, name: param, value }),
      });
    } catch (e) {
      console.error('[Settings] Failed to save setting to DB:', e.message);
    }
  }, []);

  /* ── 5-second simulation loop ── */
  useEffect(() => {
    const simInterval = setInterval(() => {
      setParameters(prev => prev.map(p => {
        const newSnapshot = [-1, -1, -1, -1, -1, -1];
        const randomActiveIndex = Math.floor(Math.random() * 6);
        newSnapshot[randomActiveIndex] = Math.random() > 0.5 ? 1 : 0;
        const newTimings = [...(p.timings || [0, 0, 0, 0, 0, 0])];
        newTimings[randomActiveIndex] += 5;
        return { ...p, snapshot: newSnapshot, timings: newTimings };
      }));
    }, 5000);
    return () => clearInterval(simInterval);
  }, []);

  /* ── 5-second telemetry sync to backend ── */
  useEffect(() => {
    if (!user) return;
    const saveInterval = setInterval(async () => {
      try {
        const payload = {
          operatorId:    user.id || user._id || 'unknown',
          operatorEmail: user.email,
          parameters,
        };
        const [r1, r2] = await Promise.all([
          fetch(`${API}/api/telemetry`,        { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }),
          fetch(`${API}/api/telemetry-timing`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }),
        ]);
        if (r1.ok && r2.ok) {
          console.log(`[SYS] Telemetry synced at ${new Date().toLocaleTimeString()}`);
        }
      } catch (e) {
        console.error('[SYS] DB offline — telemetry not saved.');
      }
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [user, parameters]);

  return (
    <TelemetryContext.Provider value={{ parameters, updateSetting, settingsReady }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => useContext(TelemetryContext);
