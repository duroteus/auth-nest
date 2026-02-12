import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor() {
    const smtpHost = process.env.SMTP_HOST || 'localhost';
    const smtpPort = parseInt(process.env.SMTP_PORT || '1025', 10);
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPassword = process.env.SMTP_PASSWORD || '';

    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@auth-nest.local';
    this.fromName = process.env.SMTP_FROM_NAME || 'Auth Nest';

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // true for 465, false for other ports
      auth:
        smtpUser && smtpPassword
          ? {
              user: smtpUser,
              pass: smtpPassword,
            }
          : undefined,
      // For development with Mailcatcher
      ignoreTLS: smtpPort === 1025,
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { to, subject, text, html } = options;

    await this.transporter.sendMail({
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to,
      subject,
      text,
      html: html || text,
    });
  }

  async sendActivationEmail(
    to: string,
    username: string,
    activationTokenId: string,
  ): Promise<void> {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const activationUrl = `${baseUrl}/activations/${activationTokenId}`;

    const subject = 'Activate your account';
    const text = `Hello ${username},\n\nTo activate your account, click the link below:\n\n${activationUrl}\n\nThis link expires in 15 minutes.\n\nIf you did not request this account, ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Activate your account</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>To activate your account, click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Activate Account
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${activationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link expires in 15 minutes.<br>
          If you did not request this account, ignore this email.
        </p>
      </div>
    `;

    await this.sendEmail({ to, subject, text, html });
  }
}
