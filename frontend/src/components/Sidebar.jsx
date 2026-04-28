import { NavLink } from 'react-router-dom';
import { Activity, LogOut, LayoutDashboard, Settings, LayoutTemplate } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="brand-logo" style={{ color: '#F5EFE7' }}>
          <Activity color="#D8C4B6" size={28} />
          <span>Industrial<span style={{ color: '#D8C4B6' }}>IoT</span></span>
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
          {/* Testing page is intentionally excluded from the Sidebar.
              Access it directly via: /dashboard/testing */}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-button">
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
