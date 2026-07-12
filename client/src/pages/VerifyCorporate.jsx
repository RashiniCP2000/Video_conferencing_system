import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";

export default function VerifyCorporate() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [pvRegistrationNumber, setPvRegistrationNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessCertificate, setBusinessCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !companyName.trim() ||
      !pvRegistrationNumber.trim() ||
      !businessAddress.trim() ||
      !contactPerson.trim() ||
      !officialEmail.trim() ||
      !phoneNumber.trim() ||
      !businessCertificate
    ) {
      setError("Please fill all required fields and upload the registration certificate.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("companyName", companyName);
      formData.append("pvRegistrationNumber", pvRegistrationNumber);
      formData.append("businessAddress", businessAddress);
      formData.append("contactPerson", contactPerson);
      formData.append("officialEmail", officialEmail);
      formData.append("phoneNumber", phoneNumber);
      formData.append("businessCertificate", businessCertificate);
      await api.post("/verify/corporate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Verification request submitted! We'll review your company details shortly.");
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
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Corporate Verification</h2>
        <p className="mt-2 text-sm text-slate-600">
          Scale your team with the Corporate plan.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-elevated py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-surface-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-slate-700">
                Company Name
              </label>
              <div className="mt-1">
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-surface-border bg-surface px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pvRegNo" className="block text-sm font-medium text-slate-700">
                PV Registration Number
              </label>
              <div className="mt-1">
                <input
                  id="pvRegNo"
                  name="pvRegNo"
                  type="text"
                  required
                  value={pvRegistrationNumber}
                  onChange={(e) => setPvRegistrationNumber(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-surface-border bg-surface px-3 py-2 text-white placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                  placeholder="PV-REG-12345"
                />
              </div>
            </div>

            <div>
              <label htmlFor="businessAddress" className="block text-sm font-medium text-slate-700">
                Business Address
              </label>
              <div className="mt-1">
                <input
                  id="businessAddress"
                  name="businessAddress"
                  type="text"
                  required
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-surface-border bg-surface px-3 py-2 text-white placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                  placeholder="Registered address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700">
                Contact Person
              </label>
              <div className="mt-1">
                <input
                  id="contactPerson"
                  name="contactPerson"
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-surface-border bg-surface px-3 py-2 text-white placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                  placeholder="Authorized person"
                />
              </div>
            </div>

            <div>
              <label htmlFor="officialEmail" className="block text-sm font-medium text-slate-700">
                Official Email
              </label>
              <div className="mt-1">
                <input
                  id="officialEmail"
                  name="officialEmail"
                  type="email"
                  required
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-surface-border bg-surface px-3 py-2 text-white placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                  placeholder="official@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-surface-border bg-surface px-3 py-2 text-white placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                  placeholder="+94..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="businessCertificate" className="block text-sm font-medium text-slate-700">
                Business Registration Certificate
              </label>
              <div className="mt-1">
                <input
                  id="businessCertificate"
                  name="businessCertificate"
                  type="file"
                  required
                  onChange={(e) => setBusinessCertificate(e.target.files?.[0] || null)}
                  className="block w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-slate-700"
                  accept="image/*,.pdf"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Note: Admin review is required before corporate activation.
            </p>

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
