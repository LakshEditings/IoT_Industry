import { Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Report from './pages/Report';
import ReportsPro from './pages/ReportsPro';
import TestReport from './pages/TestReport';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import GuestGuard from './guards/GuestGuard';
import AuthGuard from './guards/AuthGuard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      
      {/* Public Routes */}
      <Route element={<GuestGuard><AuthLayout /></GuestGuard>}>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>

      {/* Private Routes */}
      <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/report" element={<Report />} />
        <Route path="/dashboard/reportspro" element={<ReportsPro />} />
        <Route path="/dashboard/testreport" element={<TestReport />} />
      </Route>
    </Routes>
  );
}

export default App;
