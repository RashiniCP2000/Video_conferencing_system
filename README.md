# Video conferencing system (MERN) — Phase 1 MVP

Phase 1 delivers: **register/login**, **create/join meetings** with **meeting codes & links**, **WebRTC audio/video** (mesh), **screen sharing**, **group chat**, and **participant list**.

Later phases add recordings, host controls, subscriptions, storage, calendar, email, and admin (per your implementation plan).

## Prerequisites

- Node.js 18+
- MongoDB running locally (or set `MONGO_URI` to Atlas)

## Setup

### 1. Server

```bash
cd server
copy .env.example .env
```

Edit `server/.env`: set `JWT_SECRET` (long random string) and `MONGO_URI`.

```bash
npm install
npm run dev
```

API and Socket.IO: `http://localhost:5000`

### 2. Client

```bash
cd client
copy .env.example .env
```

`client/.env` should set:

```env
VITE_API_URL=http://localhost:5000
```

(`VITE_API_URL` is required so Socket.IO connects to the backend during local development.)

```bash
npm install
npm run dev
```

Open `http://localhost:5173` — register, create a meeting, share the `/meet/CODE` link with another browser or device to test video and chat.

## Architecture notes

- **Auth**: JWT, bcrypt password hashing, MongoDB `User` model.
- **Meetings**: Short **8-character hex** `meetingCode`, persisted in `Meeting` collection; join link is `/meet/:meetingCode`.
- **Realtime**: Socket.IO for signaling, chat, and presence.
- **WebRTC**: Mesh topology via `simple-peer` (good for small groups; Phase 2+ can introduce an SFU such as mediasoup for scale).

## Limitations (by design for Phase 1)

- No recording, waiting room, host mute/remove, or subscription logic yet.
- Mesh performance degrades with many participants; fine for internship demos with a few users.
