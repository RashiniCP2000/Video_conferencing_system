import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="text-2xl font-bold text-blue-600">zoom</div>
          <nav className="flex items-center gap-8">
            <button className="text-slate-700 hover:text-slate-900">Schedule</button>
            <button className="text-slate-700 hover:text-slate-900">Host</button>
            <button className="text-slate-700 hover:text-slate-900">Plans & Pricing</button>
            
            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white hover:shadow-lg"
              >
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-12 z-50 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-sm text-slate-600">{user?.email}</p>
                  </div>
                  <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50">
                    Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50">
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full border-t border-slate-200 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 bg-slate-50">
          <nav className="space-y-6 p-6">
            {/* My Products */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                My Products
              </h3>
              <ul className="space-y-2">
                <li>
                  <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-white">
                    📅 <span>Meetings</span>
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-white">
                    🎥 <span>Recordings</span>
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-white">
                    ⏰ <span>Scheduler</span>
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-white">
                    🔔 <span>Set Reminder</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* My Account */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                My Account
              </h3>
              <ul className="space-y-2">
                <li>
                  <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-white">
                    👤 <span>Profile</span>
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-white">
                    ⚙️ <span>Settings</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Admin */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Admin
              </h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-white"
                  >
                    🛠️ <span>Dashboard</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            {/* User Profile Card */}
            <div className="mb-12 rounded-2xl border border-slate-200 bg-white p-8">
              <div className="flex items-start gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-3xl font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-slate-900">{user?.name}</h2>
                  <p className="text-slate-600">Plan: <span className="font-semibold">Workplace Basic</span></p>
                  <button className="mt-4 rounded-lg border border-slate-300 bg-white px-6 py-2 font-semibold text-slate-900 hover:bg-slate-50">
                    Manage Plan
                  </button>
                  <button className="ml-3 text-blue-600 hover:text-blue-700">
                    View Plan Details
                  </button>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <h3 className="mb-6 text-2xl font-bold text-slate-900">Recent activity</h3>
                <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                  <div className="text-center">
                    <div className="mb-3 text-5xl">📦</div>
                    <p className="text-slate-600">No recent activity</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Personal Meeting ID */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="mb-3 font-semibold text-slate-900">Personal Meeting ID</h3>
                  <p className="text-lg font-mono text-slate-600">543 517 4501</p>
                  <button className="mt-3 text-sm text-blue-600 hover:text-blue-700">
                    Copy
                  </button>
                </div>

                {/* Meetings */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Meetings</h3>
                    <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                      Visit Meetings
                    </a>
                  </div>
                  <p className="mb-4 text-slate-600">No Upcoming Meetings</p>
                  <button className="w-full rounded-lg border border-slate-300 bg-white py-2 font-semibold text-slate-900 hover:bg-slate-50">
                    Test Audio and Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
