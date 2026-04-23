import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GuestGuard = ({ children }) => {
  const { user } = useAuth();

  // If the user IS logged in, they shouldn't be on guest pages (like login/signup)
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, allow them to view the guest pages
  return children;
};

export default GuestGuard;
