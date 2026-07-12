import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import meetingRoutes from "./routes/meetings.js";
import verifyRoutes from "./routes/verify.js";
import paymentRoutes from "./routes/payments.js";
import recordingsRoutes from "./routes/recordings.js";
import calendarRoutes from "./routes/calendar.js";
import adminRoutes from "./routes/admin.js";
import universityRoutes from "./routes/universities.js";
import { preventNoSqlInjection } from "./middleware/sanitize.js";
import { setupSocket } from "./socket/handlers.js";
import { startCleanupScheduler } from "./utils/cleanupScheduler.js";

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.warn(
    "[warn] Set JWT_SECRET (min 16 chars) in server/.env — auth will be insecure otherwise."
  );
}

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.CLIENT_ORIGIN
    ].filter(Boolean);
    if (!origin || allowed.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

// Stripe webhook needs raw body for signature verification
// We'll handle this by placing it before express.json() in index.js 
// or by using a custom parser. 
// For now, let's just register the routes.
app.use("/api/payments", paymentRoutes);

app.use(express.json());
app.use(preventNoSqlInjection);
app.use("/uploads", express.static("uploads"));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/recordings", recordingsRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/universities", universityRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
setupSocket(io);

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }
  await connectDb(mongoUri);
  console.log("MongoDB connected");

  // Start background task for corporate recordings cleanup
  startCleanupScheduler();

  server.listen(PORT, () => {
    console.log(`API + Socket.IO listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
