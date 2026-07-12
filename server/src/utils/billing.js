import crypto from "crypto";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export function normalizePlanInterval(plan, interval = "monthly") {
  if (plan === "student") return "one_time";
  return interval === "yearly" ? "yearly" : "monthly";
}

export function getPlanCharge(plan, interval = "monthly") {
  if (plan === "student") {
    return { amount: 1500, currency: "LKR", label: "Student Plan", interval: "one_time" };
  }

  const normalizedInterval = normalizePlanInterval(plan, interval);
  return {
    amount: normalizedInterval === "yearly" ? 20000 : 2000,
    currency: "LKR",
    label: "Corporate Plan",
    interval: normalizedInterval,
  };
}

export function buildOrderId(prefix = "ORD") {
  const stamp = Date.now().toString(36).toUpperCase();
  const token = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${stamp}-${token}`;
}

export function buildPayHereCheckout({
  merchantId,
  merchantSecret,
  orderId,
  amount,
  currency,
  returnUrl,
  cancelUrl,
  notifyUrl,
  customer,
  items,
  plan,
  interval,
}) {
  const md5Secret = crypto.createHash("md5").update(merchantSecret).digest("hex");
  const hash = crypto
    .createHash("md5")
    .update(`${merchantId}${orderId}${amount.toFixed(2)}${currency}${md5Secret}`)
    .digest("hex");

  return {
    checkoutUrl: process.env.PAYHERE_CHECKOUT_URL || "https://sandbox.payhere.lk/pay/checkout",
    fields: {
      merchant_id: merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      order_id: orderId,
      items,
      currency,
      amount: amount.toFixed(2),
      first_name: customer.firstName || customer.name || "",
      last_name: customer.lastName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      country: customer.country || "Sri Lanka",
      custom_1: plan,
      custom_2: interval,
      hash,
    },
  };
}

export function verifyPayHereSignature({
  merchantId,
  orderId,
  amount,
  currency,
  statusCode,
  signature,
  merchantSecret,
}) {
  const md5Secret = crypto.createHash("md5").update(merchantSecret).digest("hex");
  const expected = crypto
    .createHash("md5")
    .update(`${merchantId}${orderId}${amount}${currency}${statusCode}${md5Secret}`)
    .digest("hex");
  return expected === String(signature || "").toLowerCase();
}

export async function writeInvoicePdf({ filePath, invoice }) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);

    doc.pipe(stream);

    doc.fontSize(22).fillColor("#111827").text("MeetNova Invoice", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#374151").text(`Invoice No: ${invoice.invoiceNumber}`);
    doc.text(`Order ID: ${invoice.orderId}`);
    doc.text(`Transaction ID: ${invoice.transactionId || "Pending"}`);
    doc.text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(13).fillColor("#111827").text("Billed To");
    doc.fontSize(11).fillColor("#374151");
    doc.text(`Name: ${invoice.customerName || ""}`);
    doc.text(`Email: ${invoice.customerEmail || ""}`);
    doc.text(`Plan: ${String(invoice.plan || "").toUpperCase()}`);
    doc.text(`Billing Cycle: ${invoice.interval === "one_time" ? "One-time" : invoice.interval}`);
    doc.moveDown();

    doc.fontSize(13).fillColor("#111827").text("Charge Summary");
    doc.fontSize(11).fillColor("#374151");
    doc.text(`Description: ${invoice.description || ""}`);
    doc.text(`Amount: ${invoice.currency} ${Number(invoice.amount || 0).toFixed(2)}`);
    doc.text(`Status: ${String(invoice.status || "").toUpperCase()}`);
    if (invoice.periodEnd) {
      doc.text(`Service Ends: ${new Date(invoice.periodEnd).toLocaleDateString()}`);
    }

    doc.moveDown(2);
    doc.fontSize(10).fillColor("#6B7280").text("Thank you for your business.", { align: "center" });

    doc.end();
  });
}
