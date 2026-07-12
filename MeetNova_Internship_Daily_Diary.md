# Internship Daily Task Diary — MeetNova Project
**Duration**: March 23, 2026 – July 4, 2026 (15 Weeks)  
**Role**: Software Engineering Intern  
**Project**: **MeetNova** — A secure MERN-based video conferencing and real-time collaboration suite.

---

## 📅 Week 1: Project Setup & Repository Skeleton (Mar 23 – Mar 27)

*   **Day 1 (Mar 23)**: Attended the corporate internship orientation session, completed system onboarding procedures, and set up the local workstation development environment including Node.js, MongoDB Community Server, VS Code, and Git tools. Participated in the team kickoff meeting to review the technical requirements and functional design of the MeetNova platform. Documented the application design roadmap and analyzed requirements for the MERN stack integration. Formulated client and server folder structures, setting up basic configurations and verifying initial npm settings.
*   **Day 2 (Mar 24)**: Initialized the Git repository and created a comprehensive `.gitignore` configuration for both the client and server projects to filter out node modules, environment keys, and build directories. Initialized the server application package file and installed Express dependencies including `express`, `mongoose`, `cors`, `dotenv`, and `nodemon` for runtime execution. Designed and constructed the server structure, creating distinct directories for routes, controllers, middleware, models, utilities, and database configurations.
*   **Day 3 (Mar 25)**: Designed the MongoDB database architecture. Programmed the user database schema in [User.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/models/User.js) using Mongoose, defining properties for email, hashed password, plan type, verified status, verification tokens, and session timestamps. Configured database indexes on the email attribute to optimize user queries and added password encryption middleware using bcrypt.
*   **Day 4 (Mar 26)**: Created the client-side project using Vite with a React template. Set up Tailwind CSS styling configuration, creating the tailwind config file and defining theme colors. Created utility variables inside the global [index.css](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/index.css) file to support automatic dark/light theme switching throughout the UI.
*   **Day 5 (Mar 27)**: Configured React Router inside [App.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/App.jsx) to set up routing for Home, Login, Register, and Pricing pages. Created placeholder components for each page to test navigation flows. Configured local Vite proxy settings to redirect API requests to the Express backend port during development, verifying successful proxy connections.

---

## 📅 Week 2: Database Models & Activity Logging (Mar 30 – Apr 3)

*   **Day 6 (Mar 30)**: Designed and constructed the subscription plan database schema in [Plan.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/models/Plan.js). Defined attributes for subscription tiers (Basic, Student, Corporate), establishing restrictions for maximum meeting duration, concurrent participants per room, and the cloud storage capacity limits allowed for meeting recordings. Created data seeding scripts to populate initial subscription settings in the database.
*   **Day 7 (Mar 31)**: Built the [ActivityLog.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/models/ActivityLog.js) schema to log user operations. Coded fields for tracking action types, timestamp markers, IP addresses, and user reference IDs, ensuring that any login, room creation, or subscription modifications are securely logged. Set up indexes to enable efficient queries by timestamp and user identity.
*   **Day 8 (Apr 01)**: Developed backend logging utilities inside `activityLogger.js`. Programmed helper functions to log user activities to MongoDB and run automated cleanup routines to purge log entries older than 30 days using MongoDB TTL indexes. Verified log writing via console outputs.
*   **Day 9 (Apr 02)**: Designed the landing page layout inside [Landing.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Landing.jsx). Coded a responsive navbar with dropdown menus, styled hero sections using Tailwind CSS, and created feature showcase grids detailing MeetNova's video conferencing features. Tested layout responsiveness across multiple simulated device viewport widths in Google Chrome.
*   **Day 10 (Apr 03)**: Built theme state providers using React Context. Programmed theme toggle hooks to switch classes on the root element. Configured local storage options to save user choices, ensuring all child components render appropriate colors when themes toggle. Added smooth transition effects to page backgrounds and buttons.

---

## 📅 Week 3: Authentication & Authorization Backend (Apr 6 – Apr 10)

*   **Day 11 (Apr 06)**: Programmed secure user registration endpoints in [auth.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/routes/auth.js). Coded validators to check incoming email formatting, hashed user passwords using bcrypt, and structured database logic to auto-assign new registrations to the Basic plan tier. Verified endpoints using Postman requests.
*   **Day 12 (Apr 07)**: Developed the login handler in [auth.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/routes/auth.js). Implemented credentials verification, generated secure JSON Web Tokens (JWT) containing user identity signatures, and configured secure HTTP-only cookies to safeguard cookies against cross-site scripting vulnerabilities. Set up session-based token expiration configurations.
*   **Day 13 (Apr 08)**: Programmed secure token refresh routes `/refresh-token` and designed the [RefreshToken.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/models/RefreshToken.js) model. Coded backend checks to detect reuse of refresh tokens, automatically revoking compromised user sessions to prevent unauthorized token hijacking.
*   **Day 14 (Apr 09)**: Developed the authorization middleware file `auth.js` in the server middleware directory. Programmed validation routines to intercept incoming API requests, decode authorization headers, verify token signatures, and inject verified user data into the request object. Wrote tests to verify middleware blocks for invalid or expired tokens.
*   **Day 15 (Apr 10)**: Created the `AuthContext.jsx` file to manage frontend authentication states. Built React functions for register, login, logout, and automatic session validation, connecting state hooks to login views and rendering user dashboards. Verified session persistence after refreshing page tabs.

---

## 📅 Week 4: Password Recovery & Onboarding UI (Apr 13 – Apr 17)

*   **Day 16 (Apr 13)**: Programmed backend email dispatch configurations inside `mailer.js`. Configured NodeMailer helper functions, set up SMTP transport integrations, and verified delivery capabilities for system notifications, security checks, and support alerts using Mailtrap credentials.
*   **Day 17 (Apr 14)**: Built responsive email layout designs in `emailTemplates.js` to dispatch security notifications. Designed layouts for verify links, password reset codes, and subscription upgrades, incorporating logo branding elements. Tested template rendering to guarantee clean layouts on desktop and mobile clients.
*   **Day 18 (Apr 15)**: Programmed forgot-password and reset-password routes in [auth.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/routes/auth.js). Developed logic to generate short-lived cryptographic reset tokens (15-minute expiration) and created endpoints to verify tokens before writing new hashed passwords to MongoDB. Verified database updates after token invalidation.
*   **Day 19 (Apr 16)**: Built custom onboarding interfaces inside [Login.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Login.jsx) and [Register.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Register.jsx). Programmed custom input forms, styled alert banners using Tailwind, added password strength checks, and set up submit transitions. Added real-time field validation to display instant errors for improper formatting.
*   **Day 20 (Apr 17)**: Created [ForgotPassword.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/ForgotPassword.jsx) and [ResetPassword.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/ResetPassword.jsx) interfaces. Connected these user forms to backend endpoints, verified client validation checks for emails, and created successful dispatch status cards. Conducted end-to-end testing of the complete password recovery flow.

---

## 📅 Week 5: WebRTC & Instant Meeting Engine (Apr 20 – Apr 24)

*   **Day 21 (Apr 20)**: Researched WebRTC connection protocols, peer-to-peer data channels, and network address translation configurations. Drafted architecture diagrams for signaling transactions, selecting Socket.io to coordinate offers and answers. Set up technical documentation for STUN/TURN configurations.
*   **Day 22 (Apr 21)**: Configured Socket.io connections inside the backend server's [index.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/index.js) entry file. Coded active connection listeners, established room creation methods, and designed handlers to track sockets associated with specific user IDs. Conducted testing using simple terminal-based socket clients.
*   **Day 23 (Apr 22)**: Created backend socket message routing handlers in [handlers.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/socket/handlers.js). Programmed endpoints to relay WebRTC SDP offers, answers, and ICE candidate variables between peers, enabling stable cross-client signaling. Checked socket routing logic by monitoring packet flows using custom debug scripts.
*   **Day 24 (Apr 23)**: Designed the conference room interface in [MeetingRoom.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/MeetingRoom.jsx). Programmed browser media queries utilizing `navigator.mediaDevices.getUserMedia` to acquire user video/audio feeds, building fallbacks for missing camera permissions. Set up local preview video components.
*   **Day 25 (Apr 24)**: Integrated peer connection flows in [MeetingRoom.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/MeetingRoom.jsx) using the simple-peer module. Coded logic to synchronize streams between participants, dynamically rendering grids to display all connected video feeds. Handled responsive scaling of video tiles for multiple active feeds.

---

## 📅 Week 6: Meeting Controls & Waiting Lobby (Apr 27 – May 1)

*   **Day 26 (Apr 27)**: Added local media state handlers in [MeetingRoom.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/MeetingRoom.jsx). Coded controls to pause camera feeds, mute microphones, and broadcast state changes through Socket.io so peers see real-time mute states. Resolved state flickering bugs during multi-user connections.
*   **Day 27 (Apr 28)**: Designed and programmed the pre-join room lobby layout. Added options to check cameras, select input microphones, choose audio devices, input user names, and test microphone volume levels before joining a room. Created visual status indicators showing audio wave patterns.
*   **Day 28 (Apr 29)**: Created a host control validation framework on the backend. Built database fields and socket filters, allowing hosts to manage who gets in and out of the meeting. Designed access middleware to confirm host privileges on session IDs.
*   **Day 29 (Apr 30)**: Designed and programmed the waiting room list interface in [MeetingRoom.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/MeetingRoom.jsx). Configured socket communications to notify hosts when guest users are in the waiting queue requesting entry. Added acceptance and rejection click triggers.
*   **Day 30 (May 01)**: Programmed passcode security requirements for private meetings. Coded socket verification steps that validate passcodes before granting connection permissions to meeting streams. Conducted tests to ensure unauthorized entries are blocked.

---

## 📅 Week 7: Meeting Scheduling & Invites (May 4 – May 8)

*   **Day 31 (May 04)**: Created the [Meeting.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/models/Meeting.js) backend schema. Structured fields to store scheduled meetings, including room titles, dates, timezones, security configurations, and participant lists. Configured database models with automatic timestamps.
*   **Day 32 (May 05)**: Programmed REST endpoints in [meetings.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/routes/meetings.js). Built endpoints to schedule meetings, update scheduled details, retrieve history, and delete meetings. Verified API endpoints using automated unit test calls.
*   **Day 33 (May 06)**: Developed the frontend schedule panel in [ScheduleMeeting.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/ScheduleMeeting.jsx). Added validation rules for dates and times, and coded logic to verify that users do not schedule overlapping calls. Handled timezone selections and input defaults.
*   **Day 34 (May 07)**: Developed the meeting logs interface in [Meetings.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Meetings.jsx). Structured meetings into 'Upcoming' and 'Past' views, complete with search boxes and quick join buttons. Added user history tabs showing meeting statistics.
*   **Day 35 (May 08)**: Programmed invitation templates inside [MeetingDetails.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/MeetingDetails.jsx). Coded copy-paste text boxes containing formatted invitations, joining URLs, passcodes, and ICS file downloads. Verified mail share forms.

---

## 📅 Week 8: Collaborative Document Notes Editor (May 11 – May 15)

*   **Day 36 (May 11)**: Designed real-time collaboration architectures for shared documents. Designed database models to store notes content, edit histories, and access permissions. Set up schemas supporting team sharing.
*   **Day 37 (May 12)**: Developed the collaborative editor view in [Notes.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Notes.jsx). Designed sidebars listing saved pages, user activity panels, document rename utilities, and a text editing workspace. Polished typography sizes.
*   **Day 38 (May 13)**: Connected the document notes editor in [Notes.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Notes.jsx) to Socket.io to sync edits. Built text diff algorithms to coordinate concurrent changes, preventing edits from overwriting each other. Handled cursor sync variables.
*   **Day 39 (May 14)**: Added rich text formatting tools to the document toolbar (headings, lists, code styles, and text weights). Wired tools to render parsed HTML previews in real time. Designed custom editor tooltips using Tailwind.
*   **Day 40 (May 15)**: Integrated local storage auto-save backups in [Notes.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Notes.jsx). Created backup mechanisms to retrieve document drafts if network connections fail or tabs close. Tested connection drops by forcing offline modes.

---

## 📅 Week 9: Collaborative Drawing Whiteboard (May 18 – May 22)

*   **Day 41 (May 18)**: Researched HTML5 Canvas element integrations and coordinate scaling rules. Developed initial prototypes to track mouse movements and render paths on the screen. Documented canvas context optimization rules.
*   **Day 42 (May 19)**: Built the whiteboard drawing workspace in [Whiteboard.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Whiteboard.jsx). Programmed drawing utilities (pencil, brush, eraser, line-weight, color palettes, and clear canvas tools). Handled coordinate tracking on touch devices.
*   **Day 43 (May 20)**: Connected whiteboard draw events to Socket.io. Programmed coordinate packet formats to synchronize paths in real time across users without lags. Optimized packet transfers by filtering out redundant mouse coordinates.
*   **Day 44 (May 21)**: Programmed scaling and coordinate offset updates in [Whiteboard.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Whiteboard.jsx) to ensure drawings align correctly on displays with different screen sizes. Verified drawings rendering across mobile devices and desktop views.
*   **Day 45 (May 22)**: Programmed canvas image export features. Added buttons to export whiteboard drawings as high-resolution PNG files for team downloads. Handled transparency and background color settings during file download processes.

---

## 📅 Week 10: Tasks Manager & Productivity Board (May 25 – May 29)

*   **Day 46 (May 25)**: Designed the database model for the project tasks management tool. Created fields for titles, descriptions, due dates, assignees, and progress stages. Established indexing rules in MongoDB to facilitate high-speed status queries.
*   **Day 47 (May 26)**: Designed and structured the tasks management page in [Tasks.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Tasks.jsx). Built category filters, sorting tools, search inputs, and progress indicators. Integrated task board columns supporting category management.
*   **Day 48 (May 27)**: Connected CRUD features in [Tasks.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Tasks.jsx) to backend endpoints. Enabled users to add tasks, update progress stages, edit text fields, and delete items. Integrated toast warnings to confirm modifications.
*   **Day 49 (May 28)**: Designed dashboard summary components for the user home page. Built alerts highlighting overdue items, upcoming deadlines, and pending tasks. Designed progress charts using local data feeds.
*   **Day 50 (May 29)**: Wrote automated API test suites to verify backend task routes. Handled empty status UI checks, error feedback banners, and loading indicators. Polished layout styling using Tailwind columns.

---

## 📅 Week 11: Calendar Connections & Integrations (Jun 1 – Jun 5)

*   **Day 51 (Jun 01)**: Developed Express backend routes inside [calendar.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/routes/calendar.js). Implemented endpoints to fetch meetings, categorize them by dates, and structure JSON payloads. Verified query outputs using Postman logs.
*   **Day 52 (Jun 02)**: Programmed calendar middleware integrations, parsing meeting timestamps into standard iCalendar structures to allow external scheduling synchronization. Tested generated ICS templates using email clients.
*   **Day 53 (Jun 03)**: Designed the calendar layout in [Calendar.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Calendar.jsx). Programmed monthly, weekly, and daily grids, using CSS transitions to navigate between views. Styled active meeting cells using custom templates.
*   **Day 54 (Jun 04)**: Developed [CalendarConnect.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/CalendarConnect.jsx) to manage external integrations. Simulated synchronization procedures with external calendars (Google and Outlook), listing sync history and statuses. Handled connection errors and setup guidelines.
*   **Day 55 (Jun 05)**: Added scheduling actions to calendar grids. Programmed clicks on empty calendar cells to pre-fill event creation parameters, opening the scheduling modal. Conducted tests on cell ranges.

---

## 📅 Week 12: Cloud Recording & Media Management (Jun 8 – Jun 12)

*   **Day 56 (Jun 08)**: Programmed database schemas for recording files in [Recording.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/models/Recording.js) and routes in [recordings.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/routes/recordings.js) to store media links, durations, formats, and associated meeting IDs. Established field constraints for storage sizes.
*   **Day 57 (Jun 09)**: Developed mock storage configurations inside the server's s3 helper file to simulate video uploads. Configured backend endpoints to generate presigned upload URLs. Tested connection simulations.
*   **Day 58 (Jun 10)**: Designed the recordings page in [Recordings.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Recordings.jsx). Structured directories and search bars to view, sort, and search past recordings. Integrated status badges for processed recordings.
*   **Day 59 (Jun 11)**: Integrated a custom player in [Recordings.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Recordings.jsx) to play back recordings inside the browser, complete with speed adjustments and timeline controls. Handled buffering states.
*   **Day 60 (Jun 12)**: Implemented recording download and delete operations, adding checks to ensure only the host can delete files. Verified client permission blocks.

---

## 📅 Week 13: Student & Corporate Verification Pages (Jun 15 – Jun 19)

*   **Day 61 (Jun 15)**: Programmed routes in [verify.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/routes/verify.js) to handle verification requests for discounted tiers, setting up file uploads for verification proofs. Checked validation payloads.
*   **Day 62 (Jun 16)**: Built backend validation filters to verify student emails. Parsed domain structures (.edu) to confirm academic affiliation before approving student plans. Wrote tests validating standard university email configurations.
*   **Day 63 (Jun 17)**: Developed corporate verification checks. Added database queries to match company details against registered corporate emails. Designed verification logic to check registry codes.
*   **Day 64 (Jun 18)**: Designed the verification form page in [VerifyStudent.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/VerifyStudent.jsx), including file upload components, student ID fields, and form validation states. Added upload progress bars.
*   **Day 65 (Jun 19)**: Built the [VerifyCorporate.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/VerifyCorporate.jsx) corporate submission page. Included inputs for tax registry keys, business emails, and details on corporate sizes. Tested validation triggers.

---

## 📅 Week 14: Checkout Billing, Mock Checkout & Subscriptions (Jun 22 – Jun 26)

*   **Day 66 (Jun 22)**: Programmed billing operations in [payments.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/routes/payments.js) and the [Subscription.js](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/server/src/models/Subscription.js) model. Handled plans, billing periods, and next invoice calculations. Verified data consistency.
*   **Day 67 (Jun 23)**: Designed the checkout details page in [CheckoutBilling.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/CheckoutBilling.jsx). Built invoice addresses inputs and country selectors. Coded active selection states.
*   **Day 68 (Jun 24)**: Built [CheckoutPayment.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/CheckoutPayment.jsx), formatting card input areas, displaying totals, and calculating taxes. Styled card inputs using custom styles.
*   **Day 69 (Jun 25)**: Created the Stripe-like simulator in [MockCheckout.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/MockCheckout.jsx). Added simulation delays and triggers for payment success/failure. Handled error states.
*   **Day 70 (Jun 26)**: Designed [PaymentSuccess.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/PaymentSuccess.jsx). Configured the backend to upgrade users' plan statuses upon payment confirmation. Checked plan status flags in User dashboard profiles.

---

## 📅 Week 15: Admin Panels, Marketing Purge, UI Polish, Support Modal, and Deployment (Jun 29 – Jul 4)

*   **Day 71 (Jun 29)**: Created [AdminDashboard.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/AdminDashboard.jsx). Built charts for active calls and system status cards. Integrated dynamic log monitoring feeds.
*   **Day 72 (Jun 30)**: Programmed the upgrade interface in [ConfirmUpgrade.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/ConfirmUpgrade.jsx) and styled sidebar links. Polished desktop sidebar routes layouts.
*   **Day 73 (Jul 01)**: Cleaned up marketing references from [Landing.jsx](file:///c:/Users/Rashini/Desktop/video%20conferencing%20system/client/src/pages/Landing.jsx). Fixed a routing bug in the TopNav component's host meeting handler. Checked header click behavior.
*   **Day 74 (Jul 02)**: Modified the Solutions dropdown to auto-scroll to the targeted pricing card and polished the pre-join lobby layout. Tested scrolling animations.
*   **Day 75 (Jul 03)**: Designed the contact popup in `SupportModal.jsx`. Cleaned up brand logo colors to ensure contrast compliance. Fixed contrast issues.
*   **Day 76 (Jul 04)**: Compiled final frontend production bundles. Ran integration tests, checked styling consistency, and pushed all updates to git. Checked bundle sizes.
