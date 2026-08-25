import { env } from '../config/env.js';

interface EmailAction {
  recipient: string;
  subject: string;
  actionUrl: string;
}

/** Provider boundary: replace the console transport with Resend, SES, or SMTP without changing auth flows. */
export const emailService = {
  async sendActionEmail({ recipient, subject, actionUrl }: EmailAction): Promise<void> {
    if (env.MAIL_MODE === 'console') {
      console.info(`[email:${subject}] ${recipient} -> ${actionUrl}`);
      return;
    }
    throw new Error('SMTP delivery has not been configured. Set MAIL_MODE=console for local development.');
  },
};
