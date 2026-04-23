import { NavLink } from 'react-router-dom';
import { Activity, LogOut, LayoutDashboard, Settings, LayoutTemplate } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const { currentThemeName, changeTheme, themes } = useTheme();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="brand-logo">
          <Activity color="var(--accent-color)" size={28} />
          <span>Industrial<span>IoT</span></span>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="operator-profile">
          <div className="operator-avatar">
            {user?.email ? user.email.charAt(0).toUpperCase() : 'O'}
          </div>
          <div className="operator-info">
            <span className="operator-label">Active Operator</span>
            <span className="operator-email">{user?.email || 'Unknown'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/dashboard/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
          <NavLink to="/dashboard/report" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutTemplate size={20} />
            <span>Report</span>
          </NavLink>
          <NavLink to="/dashboard/testing" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Activity size={20} />
            <span>Testing</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <select 
            value={currentThemeName} 
            onChange={(e) => changeTheme(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
          >
            {themes.map(t => <option key={t} value={t}>{t} Theme</option>)}
          </select>
        </div>

        <button onClick={logout} className="logout-button">
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
