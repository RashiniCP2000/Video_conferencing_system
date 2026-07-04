const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VideoConf Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #1f2937;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 30px 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; text-transform: uppercase;">
                VideoConf
              </h1>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} VideoConf Inc. All rights reserved.
              </p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #cbd5e1;">
                You received this email because you are a registered user of VideoConf.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export function passwordResetEmail(resetUrl, userName = 'User') {
  return baseTemplate(`
    <h2 style="margin-top: 0; color: #111827; font-size: 20px; font-weight: 600;">Hello ${userName},</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
      We received a request to reset your account password. If you didn't request this, you can safely ignore this email.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 30px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
        Reset Password
      </a>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">
      This link will expire in 1 hour. If the button doesn't work, copy and paste the following URL into your browser:
    </p>
    <p style="font-size: 13px; word-break: break-all; color: #4f46e5; margin-top: 8px;">
      <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
    </p>
  `);
}

export function meetingInviteEmail(meetingTitle, meetingLink, hostName = 'A user', scheduledTime = null) {
  const timeInfo = scheduledTime 
    ? `<p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 12px;">
         <strong>Time:</strong> ${new Date(scheduledTime).toLocaleString()}
       </p>` 
    : '';

  return baseTemplate(`
    <h2 style="margin-top: 0; color: #111827; font-size: 20px; font-weight: 600;">Meeting Invitation</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      <strong>${hostName}</strong> has invited you to join a video conferencing session.
    </p>
    <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">
        ${meetingTitle}
      </p>
      ${timeInfo}
      <p style="font-size: 14px; color: #4b5563; margin: 0;">
        You can join the meeting directly by clicking the button below or using the link.
      </p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${meetingLink}" target="_blank" style="background-color: #10b981; color: #ffffff; padding: 12px 30px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
        Join Meeting
      </a>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">
      If the button above does not work, use this URL:
    </p>
    <p style="font-size: 13px; word-break: break-all; color: #10b981; margin-top: 8px;">
      <a href="${meetingLink}" style="color: #10b981;">${meetingLink}</a>
    </p>
  `);
}

export function recordingReadyEmail(meetingTitle, recordingUrl) {
  return baseTemplate(`
    <h2 style="margin-top: 0; color: #111827; font-size: 20px; font-weight: 600;">Recording Ready!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      The video recording for your meeting <strong>"${meetingTitle}"</strong> has finished processing and is now ready.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${recordingUrl}" target="_blank" style="background-color: #6366f1; color: #ffffff; padding: 12px 30px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);">
        View Recording
      </a>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">
      You can download or playback the file in your recordings dashboard.
    </p>
  `);
}

export function welcomeEmail(userName) {
  const dashboardUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  return baseTemplate(`
    <h2 style="margin-top: 0; color: #111827; font-size: 22px; font-weight: 700;">Welcome to VideoConf, ${userName}! 🎉</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      We're thrilled to have you on board. Your account has been successfully created and you're ready to start collaborating with your team through seamless HD video meetings.
    </p>
    <div style="background-color: #f0f4ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 14px; font-weight: 700; color: #4f46e5; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">What you can do with VideoConf:</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #374151;">
            📹 &nbsp;<strong>Create instant meetings</strong> and invite participants with a single link
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #374151;">
            🎙️ &nbsp;<strong>Record your meetings</strong> and access them in your library anytime
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #374151;">
            📅 &nbsp;<strong>Sync with Google Calendar</strong> and never miss a scheduled session
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #374151;">
            🖥️ &nbsp;<strong>Share your screen</strong> during meetings for seamless collaboration
          </td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 36px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px -2px rgba(79, 70, 229, 0.4);">
        Go to Dashboard
      </a>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #9ca3af; margin-bottom: 0; text-align: center;">
      Need help? Reply to this email or visit our support page.
    </p>
  `);
}

export function paymentSuccessEmail(userName, plan, amount) {
  const dashboardUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const planName = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Premium';
  const amountFormatted = amount ? `$${(amount / 100).toFixed(2)}` : '';

  return baseTemplate(`
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 28px; margin-bottom: 8px;">
        ✓
      </div>
    </div>
    <h2 style="margin-top: 0; color: #111827; font-size: 22px; font-weight: 700; text-align: center;">Payment Successful!</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px; text-align: center;">
      Thank you, <strong>${userName}</strong>! Your subscription has been activated.
    </p>
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #d1fae5;">
            <strong>Plan</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #059669; font-weight: 700; text-align: right; border-bottom: 1px solid #d1fae5;">
            ${planName} Plan
          </td>
        </tr>
        ${amountFormatted ? `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #d1fae5;">
            <strong>Amount Charged</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #374151; font-weight: 600; text-align: right; border-bottom: 1px solid #d1fae5;">
            ${amountFormatted}
          </td>
        </tr>` : ''}
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #374151;">
            <strong>Status</strong>
          </td>
          <td style="padding: 8px 0; font-size: 14px; text-align: right;">
            <span style="background-color: #d1fae5; color: #065f46; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700;">ACTIVE</span>
          </td>
        </tr>
      </table>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
      You now have access to all <strong>${planName}</strong> features. Start creating meetings and collaborating with your team right away!
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${dashboardUrl}" target="_blank" style="background-color: #059669; color: #ffffff; padding: 14px 36px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px -2px rgba(5, 150, 105, 0.4);">
        Go to Dashboard
      </a>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #9ca3af; margin-bottom: 0; text-align: center;">
      Questions about billing? Reply to this email and we'll be happy to help.
    </p>
  `);
}

export function otpEmail(otp, userName = 'User') {
  return baseTemplate(`
    <h2 style="margin-top: 0; color: #111827; font-size: 20px; font-weight: 600;">Hello ${userName},</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
      We received a request to reset your MeetNova account password. Use the verification code below to continue.
      This code is valid for <strong>10 minutes</strong>.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #5b21b6, #7c3aed); border-radius: 16px; padding: 24px 48px;">
        <p style="color: rgba(255,255,255,0.75); font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 10px;">Your Verification Code</p>
        <p style="color: #ffffff; font-size: 42px; font-weight: 900; letter-spacing: 16px; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
      </div>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 8px;">
      Enter this code on the verification page to proceed with resetting your password.
    </p>
    <p style="font-size: 13px; line-height: 1.6; color: #9ca3af; margin-bottom: 0;">
      If you did not request a password reset, you can safely ignore this email. Your account remains secure.
    </p>
  `);
}
