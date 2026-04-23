import { NavLink } from 'react-router-dom';

const Menubar = () => {
  return (
    <nav className="menubar">
      <NavLink 
        to="/signin" 
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        Sign In
      </NavLink>
      <NavLink 
        to="/signup" 
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      >
        Sign Up
      </NavLink>
    </nav>
  );
};

export default Menubar;
