import { createContext, useState, useContext, useEffect } from 'react';

const themes = {
  Default: {
    primary1: "#0078d7",
    primary2: "#e07b00",
    secondary1: "#222222",
    secondary2: "#1c0707",
    secondary3: "#fcfcfc",
    accent: "#2ca02c",
  },
  Obsidian: {
    primary1: "#00A8E8",
    primary2: "#0077B6",
    secondary1: "#0A0F1A",
    secondary2: "#1C2526",
    secondary3: "#E6F1FA",
    accent: "#FFD700",
  },
  Titanium: {
    primary1: "#4CAF50",
    primary2: "#388E3C",
    secondary1: "#E8ECEF",
    secondary2: "#CFD8DC",
    secondary3: "#212121",
    accent: "#FF5722",
  },
  Neon: {
    primary1: "#FF007A",
    primary2: "#C51162",
    secondary1: "#120321",
    secondary2: "#2A0A3F",
    secondary3: "#FFFFFF",
    accent: "#00FFCC",
  },
  Aurora: {
    primary1: "#7B68EE",
    primary2: "#6A5ACD",
    secondary1: "#1B263B",
    secondary2: "#415A77",
    secondary3: "#E0E7FF",
    accent: "#FFB6C1",
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentThemeName, setCurrentThemeName] = useState('Default');

  useEffect(() => {
    const savedTheme = localStorage.getItem('iot_theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentThemeName(savedTheme);
    }
  }, []);

  useEffect(() => {
    const theme = themes[currentThemeName];
    if (theme) {
      const root = document.documentElement;
      // Map to our app's CSS variables
      root.style.setProperty('--bg-dark', theme.secondary1);
      root.style.setProperty('--bg-panel', theme.secondary2);
      root.style.setProperty('--text-primary', theme.secondary3);
      root.style.setProperty('--accent-color', theme.primary1);
      root.style.setProperty('--accent-hover', theme.primary2);
      root.style.setProperty('--success', theme.accent); // Overload success to be the accent color for data blocks
      localStorage.setItem('iot_theme', currentThemeName);
    }
  }, [currentThemeName]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentThemeName(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentThemeName, changeTheme, themes: Object.keys(themes) }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
