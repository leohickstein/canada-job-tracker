import 'dotenv/config';
import nodemailer from 'nodemailer';
import fs from 'fs';

const { SMTP_SERVER, SMTP_PORT = '465', SMTP_USERNAME, SMTP_PASSWORD, EMAIL_TO } = process.env;

if (!SMTP_SERVER || !SMTP_USERNAME || !SMTP_PASSWORD || !EMAIL_TO) {
  console.log('SMTP not configured; skipping email.');
  process.exit(0);
}

const payload = JSON.parse(fs.readFileSync('website/data/jobs.json', 'utf-8'));
const total = payload?.total ?? (payload?.jobs?.length ?? 0);

const transporter = nodemailer.createTransport({
  host: SMTP_SERVER,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD }
});

const html = `<h3>Daily Jobs Digest</h3>
<p>${total} postings currently available.</p>
<p>Open the site to view details.</p>`;

await transporter.sendMail({
  from: `"Jobs Tracker" <${SMTP_USERNAME}>`,
  to: EMAIL_TO,
  subject: 'Daily Jobs Digest',
  html
});

console.log('Email sent ✅');
