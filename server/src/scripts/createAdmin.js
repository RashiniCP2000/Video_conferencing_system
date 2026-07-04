import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { User } from "../models/User.js";

async function main() {
  const mongoUri = process.env.MONGO_URI;
  const name = process.env.ADMIN_NAME || "System Admin";
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!mongoUri) {
    throw new Error("Missing MONGO_URI in server/.env");
  }

  if (!email || !password || password.length < 6) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (min 6 characters) in server/.env");
  }

  await connectDb(mongoUri);

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        email,
        passwordHash,
        role: "admin",
        status: "active",
      },
    },
    { new: true, upsert: true }
  );

  console.log(`System admin ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
