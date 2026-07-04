import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import api from "./api/client.js";
import { useAuth } from "./context/AuthContext.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Pricing from "./pages/Pricing.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import VerifyStudent from "./pages/VerifyStudent.jsx";
import VerifyCorporate from "./pages/VerifyCorporate.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import ConfirmUpgrade from "./pages/ConfirmUpgrade.jsx";
import CheckoutBilling from "./pages/CheckoutBilling.jsx";
import CheckoutPayment from "./pages/CheckoutPayment.jsx";
import Recordings from "./pages/Recordings.jsx";
import CalendarConnect from "./pages/CalendarConnect.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EducationDataCollection from "./pages/EducationDataCollection.jsx";
import EducationDataThankYou from "./pages/EducationDataThankYou.jsx";
import ScheduleMeeting from "./pages/ScheduleMeeting.jsx";
import MeetingDetails from "./pages/MeetingDetails.jsx";
import Meetings from "./pages/Meetings.jsx";
import Profile from "./pages/Profile.jsx";
import Calendar from "./pages/Calendar.jsx";
import Tasks from "./pages/Tasks.jsx";
import Notes from "./pages/Notes.jsx";
import Whiteboard from "./pages/Whiteboard.jsx";

const MeetingRoom = lazy(() => import("./pages/MeetingRoom.jsx"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1419] text-slate-400 text-sm">
      Loading…
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function isSystemAdmin(user) {
  return user?.role === "admin" && user?.email?.toLowerCase().endsWith("@admin.com");
}

function getDashboardPath(user) {
  return isSystemAdmin(user) ? "/admin" : "/dashboard";
}

function RootRoute() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Landing />;
  if (!user) return <PageLoader />;
  return <Navigate to={getDashboardPath(user)} replace />;
}

function UserDashboardRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <PageLoader />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <PageLoader />;
  if (!isSystemAdmin(user)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { token, logout, setUserFromBootstrap } = useAuth();

  useEffect(() => {
    if (!token) return;
    api
      .get("/auth/me")
      .then(({ data }) => setUserFromBootstrap(data.user))
      .catch(() => logout());
  }, [token, logout, setUserFromBootstrap]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/education-data" element={<ProtectedRoute><EducationDataCollection /></ProtectedRoute>} />
        <Route path="/education-thank-you" element={<ProtectedRoute><EducationDataThankYou /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/" element={<RootRoute />} />
        <Route path="/dashboard" element={<UserDashboardRoute><UserDashboard /></UserDashboardRoute>} />
        <Route path="/meet/:meetingCode" element={<MeetingRoom />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/verify/student" element={<ProtectedRoute><VerifyStudent /></ProtectedRoute>} />
        <Route path="/verify/corporate" element={<ProtectedRoute><VerifyCorporate /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/confirm-upgrade" element={<ProtectedRoute><ConfirmUpgrade /></ProtectedRoute>} />
        <Route path="/checkout/billing" element={<ProtectedRoute><CheckoutBilling /></ProtectedRoute>} />
        <Route path="/checkout/payment" element={<ProtectedRoute><CheckoutPayment /></ProtectedRoute>} />
        <Route path="/recordings" element={<ProtectedRoute><Recordings /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><ScheduleMeeting /></ProtectedRoute>} />
        <Route path="/meetings/:tab" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
        <Route path="/meetings" element={<Navigate to="/meetings/upcoming" replace />} />
        <Route path="/meetings/details" element={<ProtectedRoute><MeetingDetails /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/whiteboard" element={<ProtectedRoute><Whiteboard /></ProtectedRoute>} />
        <Route path="/settings/calendar" element={<ProtectedRoute><CalendarConnect /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
