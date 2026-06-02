import { Router } from "express";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

async function getAuthorizedClient(user) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/calendar/callback"
  );

  client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      user.googleAccessToken = tokens.access_token;
      if (tokens.refresh_token) {
        user.googleRefreshToken = tokens.refresh_token;
      }
      await user.save();
    }
  });

  return client;
}

router.get("/auth-url", authRequired, (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/calendar/callback"
    );

    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state: token,
      prompt: "consent",
    });

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate auth URL" });
  }
});

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  if (!code || !state) {
    return res.redirect(`${clientOrigin}/settings/calendar?error=missing_params`);
  }

  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const userId = decoded.sub;

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/calendar/callback"
    );

    const { tokens } = await client.getToken(code);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect(`${clientOrigin}/settings/calendar?error=user_not_found`);
    }

    user.googleAccessToken = tokens.access_token;
    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token;
    }
    user.googleCalendarConnected = true;
    await user.save();

    res.redirect(`${clientOrigin}/settings/calendar?success=true`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect(`${clientOrigin}/settings/calendar?error=auth_failed`);
  }
});

router.post("/add-event", authRequired, async (req, res) => {
  try {
    const { title, description, startTime, endTime, meetingLink } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user || !user.googleCalendarConnected) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    const client = await getAuthorizedClient(user);
    const calendar = google.calendar({ version: "v3", auth: client });

    const event = {
      summary: title || "Video Conference Meeting",
      description: `${description || ""}\n\nJoin Meeting: ${meetingLink}`,
      start: {
        dateTime: startTime || new Date().toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        timeZone: "UTC",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 10 },
          { method: "email", minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    res.json({
      message: "Event added to Google Calendar",
      htmlLink: response.data.htmlLink,
    });
  } catch (err) {
    console.error("Failed to create Google Calendar event:", err);
    res.status(500).json({ message: "Failed to add event to Google Calendar", error: err.message });
  }
});

router.get("/status", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("googleCalendarConnected");
    res.json({
      connected: !!user?.googleCalendarConnected,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch calendar status" });
  }
});

router.post("/disconnect", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      user.googleAccessToken = undefined;
      user.googleRefreshToken = undefined;
      user.googleCalendarConnected = false;
      await user.save();
    }
    res.json({ message: "Google Calendar disconnected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to disconnect Google Calendar" });
  }
});

export default router;
