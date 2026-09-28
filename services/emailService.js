const nodemailer = require('nodemailer');

const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const isConfigured = required.every((key) => String(process.env[key] || '').trim());
const port = Number(process.env.SMTP_PORT) || 587;

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  : null;

const from = process.env.SMTP_FROM || 'VOLTIX <no-reply@voltix.com>';
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ensureConfigured = () => {
  if (!transporter) {
    const error = new Error('Email service is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.');
    error.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
    error.statusCode = 503;
    throw error;
  }
};

const sendMail = async ({ to, subject, title, intro, buttonText, buttonUrl, otp, footer }) => {
  ensureConfigured();
  const safeUrl = escapeHtml(buttonUrl || '');
  const safeOtp = escapeHtml(otp || '');
  await transporter.sendMail({
    from,
    to,
    subject,
    text: `${title}\n\n${intro}${otp ? `\n\nYour one-time code is: ${otp}` : ''}${buttonUrl ? `\n\n${buttonText}: ${buttonUrl}` : ''}\n\n${footer}`,
    html: `
      <div style="margin:0;background:#f4f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#102a43">
        <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #dbe4ef;border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(16,42,67,.08)">
          <div style="font-size:22px;font-weight:800;color:#0f2d55;margin-bottom:24px">VOLTIX</div>
          <h1 style="font-size:24px;margin:0 0 14px">${escapeHtml(title)}</h1>
          <p style="font-size:15px;line-height:1.6;color:#52677d">${escapeHtml(intro)}</p>
          ${otp ? `<div style="margin:26px 0;padding:18px;border:1px solid #dbe4ef;border-radius:12px;text-align:center;background:#f7faff"><div style="font-size:11px;letter-spacing:.16em;font-weight:800;color:#6b7f93">ONE-TIME CODE</div><div style="font-size:34px;letter-spacing:.22em;font-weight:900;color:#1557d6;margin-top:8px">${safeOtp}</div></div>` : ''}
          ${buttonUrl ? `<p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:700">${escapeHtml(buttonText)}</a></p>` : ''}
          <p style="font-size:13px;line-height:1.6;color:#6b7f93">${escapeHtml(footer)}</p>
        </div>
      </div>
    `,
  });
};

const sendEmailVerificationEmail = async (toEmail, verifyUrl, otp) => sendMail({
  to: toEmail,
  subject: 'Your VOLTIX email verification code',
  title: 'Verify your VOLTIX email',
  intro: 'Thanks for creating your VOLTIX account. Enter the one-time code below to activate your account.',
  otp,
  buttonText: 'Verify email address',
  buttonUrl: verifyUrl,
  footer: 'Your verification code and link expire in 15 minutes. If you did not create this account, you can ignore this email.',
});

const sendPasswordResetEmail = async (toEmail, otp) => sendMail({
  to: toEmail,
  subject: 'Your VOLTIX password reset code',
  title: 'Reset your password',
  intro: 'We received a request to reset your VOLTIX password. Enter the one-time code below to continue.',
  otp,
  footer: 'This password reset code expires in 10 minutes. If you did not request this, you can safely ignore this email.',
});

const verifyEmailTransport = async () => { ensureConfigured(); await transporter.verify(); return true; };

module.exports = { isConfigured, sendEmailVerificationEmail, sendPasswordResetEmail, verifyEmailTransport };
