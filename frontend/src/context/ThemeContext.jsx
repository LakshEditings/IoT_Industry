import { createContext, useState, useContext, useEffect } from 'react';

/**
 * INDUSTRIAL PALETTE
 * #213555 – Deep Navy    → sidebar, headings, dark text
 * #3E5879 – Mid Navy     → accent, secondary text
 * #D8C4B6 – Warm Taupe   → borders, muted tones
 * #F5EFE7 – Off-White    → page background
 * 
 * To change the theme later, add a new entry to THEMES below and it
 * will automatically appear as an option wherever useTheme() is consumed.
 */
const THEMES = {
  Industrial: {
    '--bg-dark':        '#F5EFE7',
    '--bg-panel':       '#ffffff',
    '--bg-sidebar':     '#213555',
    '--text-primary':   '#213555',
    '--text-secondary': '#3E5879',
    '--accent-color':   '#3E5879',
    '--accent-hover':   '#213555',
    '--border-color':   '#D8C4B6',
    '--error':          '#c0392b',
    '--success':        '#27ae60',
    '--glass-bg':       'rgba(255,255,255,0.7)',
    '--glass-border':   'rgba(216,196,182,0.4)',
  },
  // ── Add future themes here ──
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentThemeName, setCurrentThemeName] = useState('Industrial');

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('iot_theme');
    if (saved && THEMES[saved]) setCurrentThemeName(saved);
  }, []);

  // Apply CSS variables whenever the theme changes
  useEffect(() => {
    const theme = THEMES[currentThemeName];
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, val]) => root.style.setProperty(key, val));
    localStorage.setItem('iot_theme', currentThemeName);
  }, [currentThemeName]);

  const changeTheme = (name) => {
    if (THEMES[name]) setCurrentThemeName(name);
  };

  return (
    <ThemeContext.Provider value={{
      currentThemeName,
      changeTheme,
      themes: Object.keys(THEMES),  // e.g. ['Industrial']
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
