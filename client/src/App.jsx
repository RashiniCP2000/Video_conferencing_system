import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import api from "./api/client.js";
import { useAuth } from "./context/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
