import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthGuard = ({ children }) => {
  const { user } = useAuth();

  // If there is no user, aggressively redirect to sign in
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Otherwise, allow them to view the protected route
  return children;
};

export default AuthGuard;
