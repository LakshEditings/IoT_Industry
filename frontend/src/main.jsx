import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TelemetryProvider } from './context/TelemetryContext';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <TelemetryProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TelemetryProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
);
