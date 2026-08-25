import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

interface EmailAction {
  recipient: string;
  subject: string;
  actionUrl: string;
}

let transporter: Transporter | undefined;

const getTransporter = () => {
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  return transporter;
};

export const emailService = {
  async sendActionEmail({ recipient, subject, actionUrl }: EmailAction): Promise<void> {
    if (env.MAIL_MODE === 'console') {
      console.info(`[email:${subject}] ${recipient} -> ${actionUrl}`);
      return;
    }

    await getTransporter().sendMail({
      from: env.SMTP_FROM,
      to: recipient,
      subject,
      text: `${subject}\n\nOpen this link: ${actionUrl}`,
      html: `<p>${subject}</p><p><a href="${actionUrl}">Open secure link</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
  },
};
