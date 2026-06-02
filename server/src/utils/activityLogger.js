import { ActivityLog } from "../models/ActivityLog.js";

/**
 * Fire-and-forget activity logger.
 * Never throws or blocks the calling request/socket handler.
 *
 * @param {Object} params
 * @param {string|null} params.userId   - Mongo ObjectId string (nullable for guests)
 * @param {string}      params.userEmail
 * @param {string}      params.userName
 * @param {"user"|"meeting"} params.category
 * @param {string}      params.action   - One of the enum values in ActivityLog schema
 * @param {Object}      [params.details] - Arbitrary contextual JSON
 * @param {string}      [params.ipAddress]
 */
export function logActivity({ userId, userEmail, userName, category, action, details, ipAddress }) {
  ActivityLog.create({
    userId: userId || null,
    userEmail: userEmail || "N/A",
    userName: userName || "Unknown",
    category,
    action,
    details: details || {},
    ipAddress: ipAddress || "Unknown",
  }).catch((err) => {
    console.error("[ActivityLogger] Failed to write log:", err.message);
  });
}

/**
 * Extract client IP from an Express request object.
 * Handles proxied requests (x-forwarded-for) and direct connections.
 */
export function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "Unknown"
  );
}
