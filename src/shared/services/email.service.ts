/**
 * Email Service - Handles sending emails via SMTP using nodemailer
 */

import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { SettingsService } from '@/src/domains/settings/services/settings.service';
import { logger } from '@/src/shared/utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
    contentType?: string;
  }>;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private settingsService: SettingsService;
  private isConfigured: boolean = false;

  constructor() {
    this.settingsService = new SettingsService();
  }

  /**
   * Initialize email transporter with SMTP settings from database
   */
  private async initializeTransporter(): Promise<boolean> {
    try {
      const emailSettings = await this.settingsService.getEmailSettings();

      // Check if SMTP is configured
      if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPassword) {
        logger.warn('Email service not configured - SMTP settings missing');
        this.isConfigured = false;
        return false;
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: emailSettings.smtpHost,
        port: emailSettings.smtpPort || 587,
        secure: emailSettings.smtpSecure, // true for 465, false for other ports
        auth: {
          user: emailSettings.smtpUser,
          pass: emailSettings.smtpPassword,
        },
        // Add connection timeout
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      // Verify connection
      await this.transporter.verify();
      this.isConfigured = true;
      logger.info('Email service initialized successfully', {
        host: emailSettings.smtpHost,
        port: emailSettings.smtpPort,
      });
      return true;
    } catch (error: any) {
      logger.error('Failed to initialize email service', {
        error: error.message,
        stack: error.stack,
      });
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Initialize transporter if not already done
      if (!this.transporter || !this.isConfigured) {
        const initialized = await this.initializeTransporter();
        if (!initialized) {
          logger.warn('Email not sent - SMTP not configured', {
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
          });
          return false;
        }
      }

      // Get email settings for from address
      const emailSettings = await this.settingsService.getEmailSettings();

      // Prepare mail options
      const mailOptions: SendMailOptions = {
        from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        attachments: options.attachments,
      };

      // Send email
      const info = await this.transporter!.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        messageId: info.messageId,
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to send email', {
        error: error.message,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const initialized = await this.initializeTransporter();
      if (!initialized) {
        return {
          success: false,
          message: 'SMTP configuration is incomplete. Please check your email settings.',
        };
      }

      const emailSettings = await this.settingsService.getEmailSettings();

      // Try to send a test email to the from address
      const testEmailSent = await this.sendEmail({
        to: emailSettings.fromEmail,
        subject: 'Test Email - SMTP Configuration',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">SMTP Configuration Test</h2>
            <p>This is a test email to verify your SMTP configuration is working correctly.</p>
            <p>If you received this email, your email settings are configured properly!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        `,
        text: 'This is a test email to verify your SMTP configuration is working correctly.',
      });

      if (testEmailSent) {
        return {
          success: true,
          message: 'Test email sent successfully! Check your inbox.',
        };
      } else {
        return {
          success: false,
          message: 'Failed to send test email. Please check your SMTP settings.',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Error testing email configuration: ${error.message}`,
      };
    }
  }

  /**
   * Check if email service is configured
   */
  async isEmailConfigured(): Promise<boolean> {
    try {
      const emailSettings = await this.settingsService.getEmailSettings();
      return !!(
        emailSettings.smtpHost &&
        emailSettings.smtpUser &&
        emailSettings.smtpPassword &&
        emailSettings.fromEmail &&
        emailSettings.fromName
      );
    } catch {
      return false;
    }
  }
}

