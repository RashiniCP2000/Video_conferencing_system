import { User } from "../models/User.js";
import { Recording } from "../models/Recording.js";
import { deleteFile } from "../config/s3.js";

async function runCleanup() {
  console.log("[Scheduler] Running daily corporate recordings cleanup job...");
  try {
    // 3 months ago cutoff (90 days)
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Find all users with corporate plan
    const corporateUsers = await User.find({ plan: "corporate" }).select("_id");
    const corporateUserIds = corporateUsers.map((u) => u._id);

    if (corporateUserIds.length === 0) {
      console.log("[Scheduler] No corporate users found. Cleanup finished.");
      return;
    }

    // Find recordings older than 90 days belonging to these users
    const expiredRecordings = await Recording.find({
      userId: { $in: corporateUserIds },
      createdAt: { $lt: cutoff },
    });

    if (expiredRecordings.length === 0) {
      console.log("[Scheduler] No expired corporate recordings found.");
      return;
    }

    console.log(`[Scheduler] Found ${expiredRecordings.length} expired recording(s) to clean up.`);

    let successCount = 0;
    for (const rec of expiredRecordings) {
      try {
        await deleteFile(rec.fileName, rec.storageType);
        await Recording.deleteOne({ _id: rec._id });
        successCount++;
      } catch (err) {
        console.error(`[Scheduler] Failed to clean up recording ${rec._id}:`, err.message);
      }
    }

    console.log(`[Scheduler] Successfully cleaned up ${successCount} recording(s).`);
  } catch (error) {
    console.error("[Scheduler] Cleanup job failed with error:", error);
  }
}

export function startCleanupScheduler() {
  // Run once immediately on start
  runCleanup();

  // Then run every 24 hours
  const INTERVAL_24H = 24 * 60 * 60 * 1000;
  setInterval(runCleanup, INTERVAL_24H);
  console.log("[Scheduler] Daily corporate recordings cleanup scheduler initialized.");
}
