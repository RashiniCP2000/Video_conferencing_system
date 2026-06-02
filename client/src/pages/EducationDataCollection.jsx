import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import educationImage from "../assets/education-form.jpg";

export default function EducationDataCollection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    streetAddress: "",
    city: "",
    zipCode: "",
    country: "",
    state: "",
    organizationWebsite: "",
    role: "teacher",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/education-data", formData);
      navigate("/education-thank-you", { replace: true });
    } catch (err) {
      console.error("Failed to save education data:", err);
      navigate("/education-thank-you", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:px-0">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/50">
          <div className="h-[480px] overflow-hidden rounded-[2rem] bg-slate-50 p-8 sm:p-10">
            <img
              src={educationImage}
              alt="Education data collection"
              className="mx-auto h-full max-h-[440px] w-full max-w-[620px] object-contain"
            />
          </div>
        </div>

        <section className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Zoom&apos;s education data
              <br />
              collection practices
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-base font-semibold text-slate-900">
                Your organization information
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="Name of organization"
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="ZIP/Postal code"
                    className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="IN">India</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <input
                  type="url"
                  name="organizationWebsite"
                  value={formData.organizationWebsite}
                  onChange={handleChange}
                  placeholder="Organization website address (Optional)"
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-base font-semibold text-slate-900">Your role in the organization</p>
              <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="role"
                    value="superintendent"
                    checked={formData.role === "superintendent"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  Superintendent/Principal/Administrator
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === "teacher"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  Teacher
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="role"
                    value="other"
                    checked={formData.role === "other"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600"
                  />
                  Other
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[1.5rem] bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading ? "Saving…" : "Continue"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
