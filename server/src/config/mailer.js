import nodemailer from 'nodemailer';

let transporter = null;

async function initMailer() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log('Using configured SMTP settings for mailer');
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: {
        user,
        pass,
      },
    });
  } else {
    console.log('No SMTP credentials found in .env. Creating Ethereal test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('Ethereal test account created successfully:');
      console.log(`User: ${testAccount.user}`);
      console.log(`Pass: ${testAccount.pass}`);
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.error('Failed to create Ethereal test account:', err);
      // Fallback transporter that logs to console
      transporter = {
        sendMail: async (options) => {
          console.log('--- FALLBACK MAIL LOGGER ---');
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log(`Body (HTML): ${options.html}`);
          console.log('-----------------------------');
          return { messageId: 'fallback-id' };
        }
      };
    }
  }

  return transporter;
}

export async function sendMail({ to, subject, html }) {
  try {
    const activeTransporter = await initMailer();
    const info = await activeTransporter.sendMail({
      from: process.env.SMTP_FROM || '"VideoConf System" <no-reply@videoconf.com>',
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`✉️ Ethereal Preview URL: ${previewUrl}`);
      return { success: true, messageId: info.messageId, previewUrl };
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}
