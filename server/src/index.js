import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import meetingRoutes from "./routes/meetings.js";
import { setupSocket } from "./socket/handlers.js";

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.warn(
    "[warn] Set JWT_SECRET (min 16 chars) in server/.env — auth will be insecure otherwise."
  );
}

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});

setupSocket(io);

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }
  await connectDb(mongoUri);
  console.log("MongoDB connected");

  server.listen(PORT, () => {
    console.log(`API + Socket.IO listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
