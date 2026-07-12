import { google } from "googleapis";

export function getGoogleAuthClient(user) {
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
    }
    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token;
    }
    await user.save();
  });

  return client;
}

export function createGoogleCalendarEventPayload({
  title,
  description,
  startTime,
  endTime,
  meetingLink,
  invitees = [],
}) {
  return {
    summary: title || "Video Conference Meeting",
    description: `${description || ""}\n\nJoin Meeting: ${meetingLink}`.trim(),
    start: {
      dateTime: startTime || new Date().toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timeZone: "UTC",
    },
    attendees: invitees.map((email) => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 10 },
        { method: "email", minutes: 30 },
      ],
    },
  };
}

export async function createGoogleCalendarEvent(user, eventPayload) {
  const client = getGoogleAuthClient(user);
  const calendar = google.calendar({ version: "v3", auth: client });
  return calendar.events.insert({
    calendarId: "primary",
    resource: eventPayload,
  });
}

export async function updateGoogleCalendarEvent(user, eventId, eventPayload) {
  const client = getGoogleAuthClient(user);
  const calendar = google.calendar({ version: "v3", auth: client });
  return calendar.events.update({
    calendarId: "primary",
    eventId,
    resource: eventPayload,
  });
}

export async function deleteGoogleCalendarEvent(user, eventId) {
  const client = getGoogleAuthClient(user);
  const calendar = google.calendar({ version: "v3", auth: client });
  return calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
}
