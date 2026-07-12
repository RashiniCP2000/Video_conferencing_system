import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";

export default function VerifyStudent() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [universityEmail, setUniversityEmail] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !universityEmail.trim() || !universityName.trim()) {
      setError("University name, university email and ID card upload are required.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    if (file) formData.append("idCard", file);
    formData.append("universityEmail", universityEmail);
    formData.append("universityName", universityName);

    try {
      await api.post("/verify/student", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Verification request submitted! We'll review it shortly.");
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Student Verification</h2>
        <p className="mt-2 text-sm text-slate-600">
          Unlock the Student plan by verifying your status.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-elevated py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-surface-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="universityName" className="block text-sm font-medium text-slate-700">
                University Name
              </label>
              <div className="mt-1">
                <input
                  id="universityName"
                  name="universityName"
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-surface-border bg-surface px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                  placeholder="University of ..."
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                University Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={universityEmail}
                  onChange={(e) => setUniversityEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-surface-border bg-surface px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                  placeholder="name@university.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Student ID Card (Photo)</label>
              <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-surface-border px-6 pt-5 pb-6">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-slate-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-slate-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-surface font-medium text-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 hover:text-blue-400"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={(e) => setFile(e.target.files[0])}
                        accept="image/*"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                  {file && <p className="text-xs text-green-400 mt-2">Selected: {file.name}</p>}
                </div>
              </div>
            </div>

            {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
            {message && <div className="text-green-400 text-sm mt-2">{message}</div>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-accent py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit for Verification"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
