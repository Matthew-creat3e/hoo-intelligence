/**
 * One-shot: email a demo HTML file to a recipient as an attachment.
 * Usage: node _send-demo-to-self.js <demoPath> <recipient>
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const [, , demoPath, to] = process.argv;
if (!demoPath || !to) { console.error('Usage: node _send-demo-to-self.js <demoPath> <recipient>'); process.exit(1); }
if (!fs.existsSync(demoPath)) { console.error('Demo not found:', demoPath); process.exit(1); }

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const FROM_NAME  = process.env.GMAIL_FROM_NAME || 'Matthew Herrman | HOO';
if (!GMAIL_USER || !GMAIL_PASS) { console.error('Missing GMAIL creds in .env'); process.exit(1); }

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: GMAIL_PASS.replace(/\s+/g, '') }
});

const filename = path.basename(demoPath);
const kb = (fs.statSync(demoPath).size / 1024).toFixed(1);

transporter.sendMail({
  from: `"${FROM_NAME}" <${GMAIL_USER}>`,
  to,
  subject: `Demo ready for mobile preview — ${filename}`,
  text:
`Here's the latest cleaning demo for mobile preview.

Open the attached HTML on your phone (tap the attachment, then "open with" browser).
Size: ${kb} KB

— HOO Build Engine`,
  attachments: [{ filename, path: demoPath, contentType: 'text/html' }]
}, (err, info) => {
  if (err) { console.error('SEND FAILED:', err.message); process.exit(1); }
  console.log('SENT:', info.messageId, '→', to);
});
