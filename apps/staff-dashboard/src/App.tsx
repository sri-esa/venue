import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ChatAssistant from './components/chat/ChatAssistant';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { MOCK_VENUE_ID } from './config/mock-data';
import AlertsPage from './pages/Alerts/AlertsPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import HeatMapPage from './pages/HeatMap/HeatMapPage';
import LoginPage from './pages/Login/LoginPage';
import QueuesPage from './pages/Queues/QueuesPage';
import StaffMapPage from './pages/StaffMap/StaffMapPage';
import { subscribeToAlerts } from './services/firebase/alert.firebase';
import { subscribeToCrowdDensity } from './services/firebase/crowd.firebase';
import { subscribeToQueueStatus } from './services/firebase/queue.firebase';
import { subscribeToStaffLocations } from './services/firebase/staff.firebase';

function AppRoutes() {
  useEffect(() => {
    const unsubscribeCrowd = subscribeToCrowdDensity(MOCK_VENUE_ID);
    const unsubscribeQueues = subscribeToQueueStatus(MOCK_VENUE_ID);
    const unsubscribeAlerts = subscribeToAlerts(MOCK_VENUE_ID);
    const unsubscribeStaff = subscribeToStaffLocations();

    return () => {
      unsubscribeCrowd();
      unsubscribeQueues();
      unsubscribeAlerts();
      unsubscribeStaff();
    };
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — requires Firebase Auth */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="heatmap" element={<HeatMapPage />} />
          <Route path="queues" element={<QueuesPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="staff-map" element={<StaffMapPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      {/* Chat assistant mounted globally — visible on all protected pages */}
      <ChatAssistant />
    </BrowserRouter>
  );
}
