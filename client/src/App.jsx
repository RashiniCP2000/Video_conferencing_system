import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import api from "./api/client.js";
import { useAuth } from "./context/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Pricing from "./pages/Pricing.jsx";
import VerifyStudent from "./pages/VerifyStudent.jsx";
import VerifyCorporate from "./pages/VerifyCorporate.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import Recordings from "./pages/Recordings.jsx";
import CalendarConnect from "./pages/CalendarConnect.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EducationDataCollection from "./pages/EducationDataCollection.jsx";
import EducationDataThankYou from "./pages/EducationDataThankYou.jsx";


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

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { token, loginWithToken, logout, setUserFromBootstrap } = useAuth();

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
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/meet/:meetingCode" element={<MeetingRoom />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/verify/student" element={<ProtectedRoute><VerifyStudent /></ProtectedRoute>} />
        <Route path="/verify/corporate" element={<ProtectedRoute><VerifyCorporate /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/recordings" element={<ProtectedRoute><Recordings /></ProtectedRoute>} />
        <Route path="/settings/calendar" element={<ProtectedRoute><CalendarConnect /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />


        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
