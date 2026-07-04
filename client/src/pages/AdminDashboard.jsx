import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, plans, verifications, reports, activityLogs

  // Activity Logs States
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit] = useState(50);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Filters for Activity Logs
  const [logsCategoryFilter, setLogsCategoryFilter] = useState("all");
  const [logsActionFilter, setLogsActionFilter] = useState("all");
  const [logsSearch, setLogsSearch] = useState("");
  const [logsStartDate, setLogsStartDate] = useState("");
  const [logsEndDate, setLogsEndDate] = useState("");

  // Data States
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, suspended
  const [planFilter, setPlanFilter] = useState("all"); // all, free, basic, student, corporate
  
  // Modals & Action States
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [adminFormError, setAdminFormError] = useState("");
  const [adminFormSuccess, setAdminFormSuccess] = useState("");
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  // User Actions States
  const [selectedUser, setSelectedUser] = useState(null); // For detailed subscription view
  const [userSubscriptionDetails, setUserSubscriptionDetails] = useState(null);
  const [loadingSubDetails, setLoadingSubDetails] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // For user profile edits
  const [editUserForm, setEditUserForm] = useState({ name: "", email: "", role: "", plan: "" });
  const [resettingPasswordUser, setResettingPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // Pricing Plan Actions States
  const [showPlanModal, setShowPlanModal] = useState(false); // For creating/editing plan
  const [editingPlan, setEditingPlan] = useState(null); // If editing, holds the plan object
  const [planForm, setPlanForm] = useState({
    planId: "",
    name: "",
    price: "",
    interval: "month",
    features: "",
    isActive: true,
    description: ""
  });
  const [planFormError, setPlanFormError] = useState("");

  // Active hover tooltip states for charts
  const [hoveredLineIndex, setHoveredLineIndex] = useState(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Load stats, activities, plans, and users on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, actRes, usersRes, plansRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/recent-activities"),
        api.get("/admin/users"),
        api.get("/admin/plans"),
      ]);
      setStats(statsRes.data);
      setRecentActivities(actRes.data);
      setUsers(usersRes.data.users);
      setPlans(plansRes.data.plans);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load dashboard data. Access denied.");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const params = {
        page,
        limit: logsLimit,
        category: logsCategoryFilter,
        action: logsActionFilter,
        search: logsSearch,
        startDate: logsStartDate,
        endDate: logsEndDate,
      };
      const { data } = await api.get("/admin/activity-logs", { params });
      setLogs(data.logs);
      setLogsTotal(data.pagination.total);
      setLogsPage(data.pagination.page);
      setLogsTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "activityLogs") {
      fetchActivityLogs(1);
    }
  }, [activeTab, logsCategoryFilter, logsActionFilter, logsStartDate, logsEndDate]);

  // Quick Action: Add new admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminFormError("");
    setAdminFormSuccess("");
    setSubmittingAdmin(true);
    try {
      const { data } = await api.post("/admin/users", adminForm);
      setAdminFormSuccess(data.message);
      setAdminForm({ name: "", email: "", password: "" });
      // Refresh user list
      const usersRes = await api.get("/admin/users");
      setUsers(usersRes.data.users);
      setTimeout(() => {
        setShowAddAdminModal(false);
        setAdminFormSuccess("");
      }, 1500);
    } catch (err) {
      setAdminFormError(err.response?.data?.message || "Failed to create administrator");
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // View User Details & Subscription history
  const handleViewUserDetails = async (u) => {
    setSelectedUser(u);
    setLoadingSubDetails(true);
    setUserSubscriptionDetails(null);
    try {
      const { data } = await api.get(`/admin/users/${u._id}/subscription`);
      setUserSubscriptionDetails(data);
    } catch (err) {
      alert("Failed to load user subscription credentials");
    } finally {
      setLoadingSubDetails(false);
    }
  };

  // Open Edit User modal
  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setEditUserForm({
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.plan
    });
  };

  // Save Edit User Changes
  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.patch(`/admin/users/${editingUser._id}`, editUserForm);
      setUsers(users.map((u) => (u._id === editingUser._id ? { ...u, ...data.user } : u)));
      setEditingUser(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user parameters");
    }
  };

  // Overwrite Password Manually
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    try {
      const { data } = await api.post(`/admin/users/${resettingPasswordUser._id}/reset-password`, {
        password: newPassword
      });
      alert(data.message);
      setResettingPasswordUser(null);
      setNewPassword("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to override user password");
    }
  };

  // Suspend/Activate User account
  const handleToggleUserStatus = async (u) => {
    const newStatus = u.status === "suspended" ? "active" : "suspended";
    const conf = window.confirm(`Are you sure you want to ${newStatus === "suspended" ? "suspend" : "activate"} this user account?`);
    if (!conf) return;

    try {
      const { data } = await api.patch(`/admin/users/${u._id}/status`, { status: newStatus });
      setUsers(users.map((item) => (item._id === u._id ? { ...item, status: data.user.status } : item)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to adjust user status");
    }
  };

  // Delete User permanently
  const handleDeleteUser = async (u) => {
    const conf = window.confirm(`WARNING: Are you sure you want to PERMANENTLY delete user ${u.name} (${u.email})? This action is irreversible.`);
    if (!conf) return;

    try {
      const { data } = await api.delete(`/admin/users/${u._id}`);
      setUsers(users.filter((item) => item._id !== u._id));
      alert(data.message);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user profile");
    }
  };

  // Create or Edit Pricing Plan
  const handleOpenPlanModal = (p = null) => {
    setEditingPlan(p);
    setPlanFormError("");
    if (p) {
      setPlanForm({
        planId: p.planId,
        name: p.name,
        price: p.price,
        interval: p.interval,
        features: p.features.join(", "),
        isActive: p.isActive,
        description: p.description || ""
      });
    } else {
      setPlanForm({
        planId: "",
        name: "",
        price: "",
        interval: "month",
        features: "",
        isActive: true,
        description: ""
      });
    }
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setPlanFormError("");

    const featuresArray = planForm.features
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const planData = {
      planId: planForm.planId,
      name: planForm.name,
      price: parseFloat(planForm.price),
      interval: planForm.interval,
      features: featuresArray,
      isActive: planForm.isActive,
      description: planForm.description
    };

    if (isNaN(planData.price)) {
      setPlanFormError("Price must be a valid numeric value.");
      return;
    }

    try {
      if (editingPlan) {
        const { data } = await api.patch(`/admin/plans/${editingPlan._id}`, planData);
        setPlans(plans.map((p) => (p._id === editingPlan._id ? data.plan : p)));
      } else {
        const { data } = await api.post("/admin/plans", planData);
        setPlans([...plans, data.plan]);
      }
      setShowPlanModal(false);
      // Refresh stats
      api.get("/admin/stats").then((statsRes) => setStats(statsRes.data)).catch(console.error);
    } catch (err) {
      setPlanFormError(err.response?.data?.message || "Failed to save pricing plan configuration");
    }
  };

  // Toggle Plan Activation
  const handleTogglePlanActivation = async (p) => {
    try {
      const { data } = await api.patch(`/admin/plans/${p._id}`, { isActive: !p.isActive });
      setPlans(plans.map((item) => (item._id === p._id ? data.plan : item)));
    } catch (err) {
      alert("Failed to adjust plan active configuration");
    }
  };

  // Delete Pricing Plan
  const handleDeletePlan = async (p) => {
    const conf = window.confirm(`Are you sure you want to delete the plan "${p.name}"?`);
    if (!conf) return;
    try {
      await api.delete(`/admin/plans/${p._id}`);
      setPlans(plans.filter((item) => item._id !== p._id));
    } catch (err) {
      alert("Failed to delete pricing plan");
    }
  };

  // Review Verifications (Approve/Reject)
  const handleVerifyAction = async (userId, action) => {
    try {
      const { data } = await api.post(`/admin/verifications/${userId}/${action}`);
      setUsers(users.map((u) => (u._id === userId ? { ...u, ...data.user } : u)));
      // Refresh statistics in background
      api.get("/admin/stats").then((statsRes) => setStats(statsRes.data)).catch(console.error);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update verification state");
    }
  };

  // User search/filter
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.status !== "suspended") ||
        (statusFilter === "suspended" && u.status === "suspended");

      const matchesPlan =
        planFilter === "all" || u.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [users, searchTerm, statusFilter, planFilter]);

  // Pending verification queue
  const pendingVerifications = useMemo(() => {
    return users.filter((u) => u.verificationStatus === "pending");
  }, [users]);

  // Format File Size
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-400">Loading system data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white px-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const overviewCards = [
    { label: "Total Users", value: stats?.cards?.totalUsers, color: "from-blue-600/20 to-indigo-600/20", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { label: "Active Users (7d)", value: stats?.cards?.activeUsers, color: "from-emerald-600/20 to-teal-600/20", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { label: "Premium Subs", value: stats?.cards?.premiumSubscribers, color: "from-amber-600/20 to-orange-600/20", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Total Meetings", value: stats?.cards?.totalMeetings, color: "from-purple-600/20 to-pink-600/20", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  ];

  return (
    <div className="min-h-screen flex bg-[#080b11] text-slate-100 font-sans">
      
      {/* 1. Sidebar Panel */}
      <aside className="w-64 bg-[#0d121f] border-r border-slate-800 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="px-6 py-6 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-white tracking-wide">Admin Room</span>
          </div>

          <nav className="mt-8 px-4 space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Dashboard Overview
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "users"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              User Directory
            </button>

            <button
              onClick={() => setActiveTab("plans")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "plans"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Subscription Plans
            </button>

            <button
              onClick={() => setActiveTab("verifications")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "verifications"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Pending Verifications
              </div>
              {pendingVerifications.length > 0 && (
                <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {pendingVerifications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("activityLogs")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "activityLogs"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Activity Logs
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "reports"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              System Reports
            </button>
          </nav>
        </div>

        {/* User Logged in state */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full mb-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl text-xs transition-all border border-slate-700"
          >
            Client Panel
          </button>
          <button
            onClick={logout}
            className="w-full bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 font-medium py-2 rounded-xl text-xs transition-all"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
        
        {/* Header toolbar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "users" && "User Directory"}
              {activeTab === "plans" && "Pricing Plans Manager"}
              {activeTab === "verifications" && "Verification Management"}
              {activeTab === "reports" && "System Reports & Manifest"}
              {activeTab === "activityLogs" && "System Activity Logs"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {activeTab === "overview" && "High level view of current system status, registrations and usage."}
              {activeTab === "users" && "Review details, assign plans, edit, suspend/activate, or delete users."}
              {activeTab === "plans" && "Create pricing plans, update price, edit feature details, or delete tiers."}
              {activeTab === "verifications" && "Approve or reject student & corporate plans based on credentials."}
              {activeTab === "reports" && "Inspect aggregated analytics data and download summary reports."}
              {activeTab === "activityLogs" && "Track real-time security, logins, system actions, and meeting event logs."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "plans" ? (
              <button
                onClick={() => handleOpenPlanModal()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Plan
              </button>
            ) : (
              <button
                onClick={() => setShowAddAdminModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add New Admin
              </button>
            )}
          </div>
        </header>

        {/* 2. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-10">
            {/* Overview stats cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewCards.map((c, i) => (
                <div
                  key={i}
                  className="bg-[#0d121f] border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all hover:-translate-y-0.5"
                >
                  <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform text-white">
                    <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={c.icon} />
                    </svg>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${c.color} text-indigo-400`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                        {c.label}
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1 block">
                        {c.value ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* User Registrations Trend */}
              <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white tracking-tight">User Registrations</h3>
                  <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">Last 7 Days</span>
                </div>
                <div className="relative h-60 w-full flex items-end">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 border-b border-slate-800">
                    <div className="border-b border-slate-700 w-full h-0"></div>
                    <div className="border-b border-slate-700 w-full h-0"></div>
                    <div className="border-b border-slate-700 w-full h-0"></div>
                  </div>

                  <div className="flex w-full h-44 justify-between items-end px-4 relative z-10">
                    {stats?.charts?.registrationTrends.map((d, index) => {
                      const maxVal = Math.max(...stats.charts.registrationTrends.map((x) => x.value), 1);
                      const heightPercent = (d.value / maxVal) * 80 + 10;
                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center flex-1 group"
                          onMouseEnter={() => setHoveredLineIndex(index)}
                          onMouseLeave={() => setHoveredLineIndex(null)}
                        >
                          <div className="w-full flex justify-center items-end relative h-40">
                            {hoveredLineIndex === index && (
                              <div className="absolute -top-10 bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-xs z-50 whitespace-nowrap shadow-xl">
                                <span className="font-bold">{d.value}</span> users
                              </div>
                            )}
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-4 bg-gradient-to-t from-indigo-600 to-violet-500 rounded-full group-hover:from-indigo-500 group-hover:to-violet-400 transition-all hover:scale-105 shadow-md"
                            ></div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase mt-3">{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Meetings Held */}
              <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white tracking-tight">Meetings Held</h3>
                  <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">Last 7 Days</span>
                </div>
                <div className="relative h-60 w-full flex items-end">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 border-b border-slate-800">
                    <div className="border-b border-slate-700 w-full h-0"></div>
                    <div className="border-b border-slate-700 w-full h-0"></div>
                    <div className="border-b border-slate-700 w-full h-0"></div>
                  </div>

                  <div className="flex w-full h-44 justify-between items-end px-4 relative z-10">
                    {stats?.charts?.meetingActivity.map((d, index) => {
                      const maxVal = Math.max(...stats.charts.meetingActivity.map((x) => x.value), 1);
                      const heightPercent = (d.value / maxVal) * 80 + 10;
                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center flex-1 group"
                          onMouseEnter={() => setHoveredBarIndex(index)}
                          onMouseLeave={() => setHoveredBarIndex(null)}
                        >
                          <div className="w-full flex justify-center items-end relative h-40">
                            {hoveredBarIndex === index && (
                              <div className="absolute -top-10 bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-xs z-50 whitespace-nowrap shadow-xl">
                                <span className="font-bold">{d.value}</span> meetings
                              </div>
                            )}
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-4 bg-gradient-to-t from-emerald-600 to-teal-500 rounded-full group-hover:from-emerald-500 group-hover:to-teal-400 transition-all hover:scale-105 shadow-md"
                            ></div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase mt-3">{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Storage & Demographics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white tracking-tight mb-6">Pricing Plan Breakdown</h3>
                <div className="space-y-4">
                  {Object.entries(stats?.charts?.subscriptionStats || {}).map(([plan, count]) => {
                    const pct = Math.round((count / (stats?.cards?.totalUsers || 1)) * 100);
                    return (
                      <div key={plan} className="space-y-1">
                        <div className="flex justify-between text-sm text-slate-300">
                          <span className="capitalize font-semibold">{plan} Plan</span>
                          <span>{count} users ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="bg-indigo-600 h-full rounded-full"
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white tracking-tight mb-6">Storage Breakdown</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm text-slate-300 mb-2">
                      <span>Local storage</span>
                      <span>{formatBytes(stats?.charts?.storageStats?.local)}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(stats?.charts?.storageStats?.local / (stats?.cards?.storageUsage || 1)) * 100}%` }}
                        className="bg-cyan-500 h-full rounded-full"
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-slate-300 mb-2">
                      <span>S3 cloud</span>
                      <span>{formatBytes(stats?.charts?.storageStats?.s3)}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(stats?.charts?.storageStats?.s3 / (stats?.cards?.storageUsage || 1)) * 100}%` }}
                        className="bg-indigo-500 h-full rounded-full"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. USER MANAGEMENT TAB */}
        {activeTab === "users" && (
          <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-6">
            
            {/* Search Box & Filters Bar */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active accounts</option>
                  <option value="suspended">Suspended accounts</option>
                </select>
              </div>

              <div>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free Tier</option>
                  <option value="basic">Basic Plan</option>
                  <option value="student">Student Tier</option>
                  <option value="corporate">Corporate Enterprise</option>
                </select>
              </div>
            </div>

            {/* Users Directory Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="pb-3 pl-4">User Details</th>
                    <th className="pb-3">Access Role</th>
                    <th className="pb-3">Active Plan</th>
                    <th className="pb-3">Registration Date</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">
                        No registered users match your search and filter parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="text-sm hover:bg-slate-900/10 transition-colors">
                        <td className="py-4 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                            u.role === "admin" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-800 text-slate-300"
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-4 capitalize font-medium text-slate-300">{u.plan}</td>

                        <td className="py-4 text-xs text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>

                        <td className="py-4 text-center">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            u.status === "suspended" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {u.status || "active"}
                          </span>
                        </td>

                        <td className="py-4 pr-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewUserDetails(u)}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md transition-colors"
                              title="Audit billing & payments"
                            >
                              Audit
                            </button>
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="text-xs bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2 py-1 rounded-md transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setResettingPasswordUser(u)}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md transition-colors"
                              title="Reset Password"
                            >
                              🔑
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`text-xs px-2 py-1 rounded-md transition-colors font-medium ${
                                u.status === "suspended"
                                  ? "bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white"
                                  : "bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white"
                              }`}
                            >
                              {u.status === "suspended" ? "Activate" : "Suspend"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="text-xs bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white px-2 py-1 rounded-md transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 4. SUBSCRIPTION PLANS TAB */}
        {activeTab === "plans" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((p) => (
                <div
                  key={p._id}
                  className={`bg-[#0d121f] border rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all hover:-translate-y-0.5 ${
                    p.isActive ? "border-slate-800 hover:border-slate-700" : "border-slate-800 opacity-60"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-white tracking-tight">{p.name}</h4>
                        <span className="text-[10px] text-slate-500 font-mono tracking-wider block mt-0.5">{p.planId}</span>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        p.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mb-4">
                      <span className="text-2xl font-black text-white">${p.price}</span>
                      <span className="text-xs text-slate-400">/{p.interval}</span>
                    </div>

                    <p className="text-xs text-slate-400 mb-6 min-h-[32px]">{p.description || "No plan description provided."}</p>

                    <div className="space-y-2 mb-6">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Features included</span>
                      {p.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-800/80">
                    <button
                      onClick={() => handleOpenPlanModal(p)}
                      className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-xl border border-slate-700 transition-all font-semibold"
                    >
                      Edit Plan
                    </button>
                    <button
                      onClick={() => handleTogglePlanActivation(p)}
                      className={`text-xs px-2.5 py-2 rounded-xl transition-all font-semibold ${
                        p.isActive
                          ? "bg-amber-600/15 hover:bg-amber-600 text-amber-400 hover:text-white"
                          : "bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white"
                      }`}
                    >
                      {p.isActive ? "Deactivate" : "Activate"}
                    </button>
                    {p.planId !== "free" && p.planId !== "basic" && p.planId !== "student" && p.planId !== "corporate" && (
                      <button
                        onClick={() => handleDeletePlan(p)}
                        className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white px-2 py-2 rounded-xl transition-all"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. VERIFICATION QUEUE TAB */}
        {activeTab === "verifications" && (
          <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-3">Pending User Verifications</h3>
            
            {pendingVerifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="w-16 h-16 bg-slate-800/40 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-white mb-1">Queue is Clear</h4>
                <p className="text-sm text-slate-400">All student and corporate verifications are up to date.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingVerifications.map((u) => (
                  <div key={u._id} className="bg-[#080b11] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-white text-base">{u.name}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          u.verificationType === "student" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        }`}>
                          {u.verificationType} submission
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">Email: {u.email}</p>

                      <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-300 max-w-xl space-y-1">
                        {u.verificationType === "student" ? (
                          <>
                            <p><span className="text-slate-500 font-semibold">University Email:</span> {u.verificationData?.universityEmail || "N/A"}</p>
                            {u.verificationData?.idCardPath && (
                              <p>
                                <span className="text-slate-500 font-semibold">ID Card File:</span>{" "}
                                <a
                                  href={`${api.defaults.baseURL.replace("/api", "")}/${u.verificationData.idCardPath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 underline hover:text-indigo-300 font-bold"
                                >
                                  View Uploaded ID Card Card
                                </a>
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p><span className="text-slate-500 font-semibold">Company Name:</span> {u.verificationData?.companyName || "N/A"}</p>
                            <p><span className="text-slate-500 font-semibold">Work Email:</span> {u.verificationData?.workEmail || "N/A"}</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                      <button
                        onClick={() => handleVerifyAction(u._id, "approve")}
                        className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                      >
                        Approve Upgrade
                      </button>
                      <button
                        onClick={() => handleVerifyAction(u._id, "reject")}
                        className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                      >
                        Reject Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* 6. REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-6 space-y-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Aggregated Performance Report</h3>
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-sm border border-slate-700 transition-all"
              >
                Print Report
              </button>
            </div>

            {/* Quick Metrics Aggregates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">User Demographic Metrics</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-slate-400">Total Account Records:</span>
                    <span className="font-bold text-white">{stats?.cards?.totalUsers}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Active Admins:</span>
                    <span className="font-bold text-white">{users.filter(u => u.role === "admin").length}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Free Accounts:</span>
                    <span className="font-bold text-white">{stats?.charts?.subscriptionStats?.free || 0}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Basic Subscriptions:</span>
                    <span className="font-bold text-white">{stats?.charts?.subscriptionStats?.basic || 0}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Academic & Corporate Verifications</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-slate-400">Active Student Users:</span>
                    <span className="font-bold text-white">{stats?.charts?.subscriptionStats?.student || 0}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Active Corporate Users:</span>
                    <span className="font-bold text-white">{stats?.charts?.subscriptionStats?.corporate || 0}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Total Premium:</span>
                    <span className="font-bold text-indigo-400">{stats?.cards?.premiumSubscribers}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">System storage & resources</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-slate-400">Total Video Conferences:</span>
                    <span className="font-bold text-white">{stats?.cards?.totalMeetings}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Total Saved Recordings:</span>
                    <span className="font-bold text-white">{stats?.cards?.totalRecordings}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Total File Usage Size:</span>
                    <span className="font-bold text-indigo-400">{formatBytes(stats?.cards?.storageUsage)}</span>
                  </li>
                </ul>
              </div>

            </div>

            <div className="bg-[#080b11] border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-300">
              <p className="font-bold text-white text-sm mb-2">// Raw Report Summary Manifest (JSON)</p>
              <pre className="overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify({
                  generatedAt: new Date().toISOString(),
                  statistics: {
                    overview: stats?.cards,
                    subscriptions: stats?.charts?.subscriptionStats,
                    storage: stats?.charts?.storageStats,
                  }
                }, null, 2)}
              </pre>
            </div>

          </div>
        )}

        {/* 6.5. ACTIVITY LOGS TAB */}
        {activeTab === "activityLogs" && (
          <div className="bg-[#0d121f] border border-slate-800 rounded-2xl p-6 space-y-6">
            
            {/* Filters grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <select
                  value={logsCategoryFilter}
                  onChange={(e) => setLogsCategoryFilter(e.target.value)}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  <option value="user">User Activities</option>
                  <option value="meeting">Meeting Activities</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Action Event</label>
                <select
                  value={logsActionFilter}
                  onChange={(e) => setLogsActionFilter(e.target.value)}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Actions</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="register">Register</option>
                  <option value="profile_update">Profile Update</option>
                  <option value="password_change">Password Change</option>
                  <option value="meeting_create">Meeting Creation</option>
                  <option value="meeting_delete">Meeting Deletion</option>
                  <option value="meeting_join">Meeting Join</option>
                  <option value="meeting_leave">Meeting Leave</option>
                  <option value="recording_start">Recording Start</option>
                  <option value="recording_stop">Recording Stop</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                <input
                  type="date"
                  value={logsStartDate}
                  onChange={(e) => setLogsStartDate(e.target.value)}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                <input
                  type="date"
                  value={logsEndDate}
                  onChange={(e) => setLogsEndDate(e.target.value)}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={() => fetchActivityLogs(1)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20"
                >
                  Refresh Logs
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search user name or email..."
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchActivityLogs(1);
                }}
                className="w-full bg-[#080b11] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="pb-3 pl-4">User</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Event Action</th>
                    <th className="pb-3">IP Address</th>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3 pr-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {logsLoading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="text-slate-400 text-xs">Loading activity records...</span>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500 text-sm">
                        No system activity log records found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isExpanded = expandedLogId === log._id;
                      return (
                        <>
                          <tr key={log._id} className="text-sm hover:bg-slate-900/10 transition-colors">
                            <td className="py-4 pl-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                                  {log.userName?.slice(0, 2).toUpperCase() || "AD"}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-xs">{log.userName}</p>
                                  <p className="text-[10px] text-slate-500">{log.userEmail}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 capitalize font-semibold text-xs text-slate-300">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                log.category === "meeting" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                              }`}>
                                {log.category}
                              </span>
                            </td>

                            <td className="py-4">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                ["login", "meeting_join", "recording_start"].includes(log.action)
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : ["logout", "meeting_leave", "recording_stop", "meeting_delete"].includes(log.action)
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {log.action.replace("_", " ")}
                              </span>
                            </td>

                            <td className="py-4 text-xs font-mono text-slate-400">{log.ipAddress}</td>

                            <td className="py-4 text-xs text-slate-400">
                              {new Date(log.createdAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </td>

                            <td className="py-4 pr-4 text-right">
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md transition-colors"
                              >
                                {isExpanded ? "Hide" : "Inspect"}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${log._id}-details`}>
                              <td colSpan="6" className="bg-[#080b11] p-4 border-t border-b border-slate-800">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">// Log Payload Details</h4>
                                  <pre className="text-xs font-mono text-indigo-300 overflow-x-auto whitespace-pre-wrap max-h-48">
                                    {JSON.stringify({
                                      logId: log._id,
                                      userId: log.userId,
                                      userName: log.userName,
                                      userEmail: log.userEmail,
                                      category: log.category,
                                      action: log.action,
                                      ipAddress: log.ipAddress,
                                      createdAt: log.createdAt,
                                      details: log.details,
                                    }, null, 2)}
                                  </pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsTotalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-xs">
                <span className="text-slate-400">
                  Showing Page <span className="font-bold text-white">{logsPage}</span> of <span className="font-bold text-white">{logsTotalPages}</span> ({logsTotal} logs)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={logsPage === 1 || logsLoading}
                    onClick={() => fetchActivityLogs(logsPage - 1)}
                    className="bg-[#080b11] border border-slate-800 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl disabled:opacity-50 transition-all font-semibold"
                  >
                    Previous
                  </button>
                  <button
                    disabled={logsPage === logsTotalPages || logsLoading}
                    onClick={() => fetchActivityLogs(logsPage + 1)}
                    className="bg-[#080b11] border border-slate-800 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl disabled:opacity-50 transition-all font-semibold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        )}


      </main>

      {/* 7. MODALS & POPUPS DIALOGS */}

      {/* MODAL A: ADD NEW ADMIN */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-[#080b11]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddAdminModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Add Administrator</h3>
            </div>

            {adminFormError && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3">
                {adminFormError}
              </div>
            )}
            {adminFormSuccess && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3">
                {adminFormSuccess}
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="e.g. Alexis Brown"
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="e.g. alexis@videoconf.com"
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-sm rounded-xl transition-all"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={submittingAdmin}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
                >
                  {submittingAdmin ? "Saving..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL B: USER DETAILED SUBSCRIPTION AUDIT */}
      {selectedUser && (
        <div className="fixed inset-0 bg-[#080b11]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3 mb-6">User Subscription & Audit Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account profile</h4>
                <p className="text-sm font-bold text-white">{selectedUser.name}</p>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
                <p className="text-xs text-slate-500">Registration: {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-slate-500">Status: <span className="capitalize text-slate-300 font-semibold">{selectedUser.status}</span></p>
              </div>

              {loadingSubDetails ? (
                <div className="flex items-center justify-center h-24">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-2 bg-[#080b11] p-4 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subscription Parameters</h4>
                  <p className="text-sm font-bold text-indigo-400 capitalize">{userSubscriptionDetails?.plan} Plan</p>
                  <p className="text-xs text-slate-400">Subscription Status: <span className="capitalize font-semibold text-slate-300">{userSubscriptionDetails?.status}</span></p>
                  <p className="text-xs text-slate-500">Started: {userSubscriptionDetails?.startDate ? new Date(userSubscriptionDetails.startDate).toLocaleDateString() : "N/A"}</p>
                  <p className="text-xs text-slate-500">Expiry: {userSubscriptionDetails?.expiryDate ? new Date(userSubscriptionDetails.expiryDate).toLocaleDateString() : "N/A"}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stripe Payment Logs History</h4>
              
              {!loadingSubDetails && userSubscriptionDetails?.history.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-800 rounded-xl">No historical subscription payments recorded.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#080b11] text-slate-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-3">Plan</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Billing Date</th>
                        <th className="p-3">Period End</th>
                        <th className="p-3 pr-4 text-right">Subscription ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {userSubscriptionDetails?.history.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-900/30 text-slate-300">
                          <td className="p-3 capitalize font-bold text-white">{h.plan}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-extrabold ${h.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                              {h.status}
                            </span>
                          </td>
                          <td className="p-3">{new Date(h.date).toLocaleDateString()}</td>
                          <td className="p-3">{new Date(h.expires).toLocaleDateString()}</td>
                          <td className="p-3 pr-4 text-right font-mono text-[10px] text-slate-500">{h.stripeId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:text-white text-slate-400 font-semibold text-sm rounded-xl transition-all"
              >
                Dismiss Audit Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL C: EDIT USER PROFILE */}
      {editingUser && (
        <div className="fixed inset-0 bg-[#080b11]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-5">Edit User Profile Information</h3>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-sm rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL D: MANUAL PASSWORD RESET */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 bg-[#080b11]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => { setResettingPasswordUser(null); setNewPassword(""); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 mb-5">Reset User Password</h3>
            <p className="text-xs text-slate-400 mb-4">Provide a new password for <span className="font-semibold text-slate-300">{resettingPasswordUser.email}</span></p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setResettingPasswordUser(null); setNewPassword(""); }}
                  className="flex-1 px-4 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-sm rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL E: CREATE OR EDIT PRICING PLAN */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-[#080b11]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d121f] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPlanModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3 mb-5">
              {editingPlan ? "Edit Pricing Plan" : "Create Subscription Plan"}
            </h3>

            {planFormError && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3">
                {planFormError}
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Plan ID (Unique slug)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingPlan)}
                    value={planForm.planId}
                    onChange={(e) => setPlanForm({ ...planForm, planId: e.target.value })}
                    placeholder="e.g. premium"
                    className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="e.g. Premium Plan"
                    className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Price (USD)
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    placeholder="e.g. 14.99"
                    className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Billing Interval
                  </label>
                  <select
                    value={planForm.interval}
                    onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value })}
                    className="w-full bg-[#080b11] border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Plan Description
                </label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Provide a summary of who this plan is tailored for."
                  rows="2"
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Plan Features (Comma separated list)
                </label>
                <input
                  type="text"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder="e.g. Unlimited meetings, Up to 100 participants, Cloud recording"
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Separate plan features with commas.</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActivePlan"
                  checked={planForm.isActive}
                  onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                  className="rounded bg-[#080b11] border-slate-850 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="isActivePlan" className="text-xs font-semibold text-slate-300">
                  Enable plan immediately (Active)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-sm rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
