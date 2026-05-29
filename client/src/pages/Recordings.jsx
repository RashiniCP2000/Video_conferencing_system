import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Recordings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null); // stores recording object to delete
  const [error, setError] = useState("");

  // Load recordings
  const fetchRecordings = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await api.get("/recordings", { params });
      setRecordings(data.recordings || []);
    } catch (err) {
      console.error("[Recordings] Fetch error:", err);
      setError(err.response?.data?.message || "Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, [startDate, endDate]); // refetch when dates change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecordings();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    // Re-fetch with clean params
    setLoading(true);
    api.get("/recordings")
      .then(({ data }) => setRecordings(data.recordings || []))
      .catch((err) => setError(err.response?.data?.message || "Failed to load recordings"))
      .finally(() => setLoading(false));
  };

  const handleDownload = (rec) => {
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const downloadUrl = rec.fileUrl.startsWith("http") ? rec.fileUrl : `${baseURL}${rec.fileUrl}`;
    
    // Trigger download in new tab
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = rec.fileName;
    a.target = "_blank";
    a.click();
  };

  const handleDeleteClick = (rec) => {
    setShowConfirmModal(rec);
  };

  const confirmDelete = async () => {
    if (!showConfirmModal) return;
    const targetId = showConfirmModal._id;
    setDeletingId(targetId);
    setShowConfirmModal(null);
    try {
      await api.delete(`/recordings/${targetId}`);
      // Smoothly update UI
      setRecordings((prev) => prev.filter((r) => r._id !== targetId));
    } catch (err) {
      console.error("[Recordings] Deletion failed:", err);
      alert("Failed to delete recording: " + (err.response?.data?.message || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  // Format Helpers
  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let res = "";
    if (hrs > 0) res += `${hrs}h `;
    if (mins > 0 || hrs > 0) res += `${mins}m `;
    res += `${secs}s`;
    return res;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Premium Header */}
      <header className="shrink-0 border-b border-slate-200 bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-slate-800 text-lg">Recordings</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 hidden sm:inline">{user?.email}</span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider">
            {user?.plan || "Free"} Plan
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">Recording Library</h1>
          <p className="text-sm text-slate-500">Manage and access all call recordings saved to your account</p>
        </div>

        {/* Filter Panel */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by meeting name or room code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto md:ml-auto">
              <button
                type="submit"
                className="flex-1 md:flex-none rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm transition-colors shadow-sm"
              >
                Search
              </button>
              {(search || startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium px-4 py-2 text-sm transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Error Notification */}
        {error && (
          <div className="rounded-xl bg-red-500/10 text-red-700 text-sm px-4 py-3 border border-red-500/20 shadow-sm">
            {error}
          </div>
        )}

        {/* Recording Grid List */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-400">Loading your recordings...</p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="flex-1 border border-dashed border-slate-200 bg-white rounded-3xl p-16 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No recordings found</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              {search || startDate || endDate
                ? "No recordings match your search filters. Try adjusting dates or keywords."
                : "Recordings you save during calls will automatically show up here."}
            </p>
            {(search || startDate || endDate) ? (
              <button
                onClick={handleClearFilters}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 text-sm transition-colors shadow-sm"
              >
                Reset search filters
              </button>
            ) : (
              <Link
                to="/"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 text-sm transition-colors shadow-sm"
              >
                Start a meeting now
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recordings.map((rec) => (
              <div
                key={rec._id}
                className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col ${
                  deletingId === rec._id ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Visual card header */}
                <div className="h-32 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent z-10" />
                  
                  {/* Decorative mesh vector */}
                  <svg className="absolute inset-0 w-full h-full text-slate-800 opacity-20" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,0 L100,100 L0,100 Z" />
                  </svg>
                  
                  {/* Duration badge */}
                  <span className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white text-xs font-semibold px-2 py-1 rounded-md z-20">
                    {formatDuration(rec.duration)}
                  </span>
                  
                  {/* Room code badge */}
                  <span className="absolute top-3 left-3 bg-blue-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider z-20 shadow-sm">
                    {rec.meetingCode}
                  </span>

                  {/* Playback graphic overlay */}
                  <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm z-20">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <h3 className="font-semibold text-slate-800 text-sm line-clamp-1" title={rec.title}>
                      {rec.title}
                    </h3>
                    <p className="text-xs text-slate-400">{formatDate(rec.createdAt)}</p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Size: <strong className="text-slate-700">{formatFileSize(rec.fileSize)}</strong></span>
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-medium text-[10px] text-slate-600">
                      {rec.storageType === "s3" ? "Cloud storage" : "Local server"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => handleDownload(rec)}
                      className="rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold py-2 text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                    <button
                      onClick={() => handleDeleteClick(rec)}
                      className="rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold py-2 text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col text-slate-800">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Recording?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to permanently delete <strong>{showConfirmModal.title}</strong>? 
              This will remove the file from cloud storage and delete the database record. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 text-sm transition-colors shadow-md"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
