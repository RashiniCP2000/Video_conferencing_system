import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon, PrinterIcon } from "@heroicons/react/24/outline";
import api from "../api/client.js";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(7);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState({
    planName: "Premium Plan",
    amount: 1500,
    transactionId: "TXN-MOCK12345",
    startDate: new Date().toLocaleDateString(),
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  });
  const [downloadError, setDownloadError] = useState("");
  const orderId = new URLSearchParams(window.location.search).get("order_id");

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      try {
        if (orderId) {
          const { data } = await api.get(`/payments/orders/${orderId}`);
          const order = data.order;
          const subscription = order.subscriptionId || {};
          if (!active) return;

          setDetails({
            planName: order.plan === "student" ? "Student Plan" : "Corporate Plan",
            amount: order.amount,
            transactionId: order.gatewayPaymentId || order.gatewaySessionId || order.orderId,
            startDate: new Date(order.createdAt).toLocaleDateString(),
            nextBillingDate: subscription.currentPeriodEnd
              ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
              : order.interval === "one_time"
                ? "N/A (One-time payment)"
                : "N/A",
            subscriptionId: subscription._id || null,
          });
        } else {
          const stored = sessionStorage.getItem("meetnova_transaction_details");
          if (stored && active) {
            setDetails(JSON.parse(stored));
          }
        }
      } catch (error) {
        if (active) {
          setDownloadError(error.response?.data?.message || "Unable to load invoice details.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrder();
    return () => {
      active = false;
    };
  }, [orderId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      // Clear wizard session cache
      sessionStorage.removeItem("meetnova_billing_info");
      sessionStorage.removeItem("meetnova_transaction_details");
      navigate("/");
    }, 7000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleDashboardRedirect = () => {
    sessionStorage.removeItem("meetnova_billing_info");
    sessionStorage.removeItem("meetnova_transaction_details");
    navigate("/");
  };

  const handleDownloadInvoice = async () => {
    if (!details.subscriptionId) {
      setDownloadError("Invoice is not available yet.");
      return;
    }

    try {
      const response = await api.get(`/payments/invoices/${details.subscriptionId}/download`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `invoice-${details.transactionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setDownloadError(error.response?.data?.message || "Failed to download invoice.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-800">
      <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-xl max-w-lg w-full relative print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Printable/Print hide class styles */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body { background: white; color: black; }
            .no-print { display: none !important; }
            .print-border { border: 1px solid #ccc !important; padding: 20px !important; }
          }
        `}} />

        <div className="no-print">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-6 animate-bounce" />
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Upgrade Successful!</h1>
          <p className="text-slate-500 mb-8">
            Thank you for upgrading! Your subscription has been activated, and all premium features are now unlocked.
          </p>
        </div>

        {/* Invoice details card */}
        <div className="bg-slate-50 border border-slate-250 rounded-2xl p-6 text-left mb-6 print-border print:bg-white print:text-black">
          <h3 className="text-sm font-bold uppercase tracking-wider text-accent mb-4 print:text-black">Invoice Summary</h3>
          
          {loading ? (
            <div className="text-sm text-slate-500">Loading invoice details...</div>
          ) : (
          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Plan Purchased:</span>
              <span className="font-semibold text-slate-800 print:text-black">{details.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Charged:</span>
              <span className="font-bold text-slate-900 print:text-black">LKR {Number(details.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono text-slate-700 print:text-black">{details.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Activation Date:</span>
              <span className="text-slate-600 print:text-black">{details.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Next Billing Date:</span>
              <span className="text-slate-600 print:text-black">{details.nextBillingDate}</span>
            </div>
          </div>
          )}
        </div>

        <div className="no-print space-y-4">
          {downloadError && <div className="text-xs text-red-500">{downloadError}</div>}
          <div className="text-xs text-slate-500">
            Redirecting you to your dashboard in <span className="text-accent font-bold">{countdown}</span> seconds...
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={details.subscriptionId ? handleDownloadInvoice : handlePrint}
              className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-750 font-medium py-3 rounded-xl transition cursor-pointer"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              {details.subscriptionId ? "Download Invoice" : "Print Invoice"}
            </button>
            
            <button
              onClick={handleDashboardRedirect}
              className="bg-accent hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
