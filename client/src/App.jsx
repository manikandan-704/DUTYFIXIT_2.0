import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ClientPage from './pages/ClientPage';
import WorkerPage from './pages/WorkerPage';
import AdminPage from './pages/AdminPage';
import ProfileBooking from './pages/ProfileBooking';
import MyBookings from './pages/MyBookings';
import Request from './pages/Request';
import UserProfile from './pages/UserProfile';
import WorkerVerify from './pages/WorkerVerify';
import BookingPage from './pages/BookingPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/client" element={<ClientPage />} />
          <Route path="/worker" element={<WorkerPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile-booking" element={<ProfileBooking />} />
          <Route path="/mybooking" element={<MyBookings />} />
          <Route path="/request" element={<Request />} />
          <Route path="/client-profile" element={<UserProfile />} />
          <Route path="/worker-verify" element={<WorkerVerify />} />
          <Route path="/booking-page" element={<BookingPage />} />
          {/* Add other routes as needed based on the existing HTML files */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
