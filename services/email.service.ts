import nodemailer from "nodemailer";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
}

export const emailService = {
  async send({ to, subject, html }: SendEmailInput) {
    const transporter = getTransporter();

    if (!transporter) {
      console.warn(
        `[email:console-fallback] SMTP not configured. Would send "${subject}" to ${to}:\n${html}`,
      );
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "Supply Chain System <no-reply@supplychain.local>",
      to,
      subject,
      html,
    });
  },

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    await this.send({
      to,
      subject: "Reset your password",
      html: `
        <p>We received a request to reset your Supply Chain & Inventory Management System password.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 1 hour.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });
  },

  async sendWelcomeEmail(to: string, name: string, setPasswordUrl: string) {
    await this.send({
      to,
      subject: "Welcome to Supply Chain & Inventory Management System",
      html: `
        <p>Hi ${name},</p>
        <p>An account has been created for you on the Supply Chain & Inventory Management System.</p>
        <p><a href="${setPasswordUrl}">Click here to set your password</a> and sign in. This link expires in 1 hour.</p>
      `,
    });
  },
};
