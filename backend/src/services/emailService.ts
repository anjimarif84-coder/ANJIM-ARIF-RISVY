import nodemailer from 'nodemailer';
import { createError } from '../middleware/errorHandler';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter;

  static initialize() {
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    this.transporter = nodemailer.createTransporter(smtpConfig);
  }

  static async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      this.initialize();
    }

    const from = process.env.EMAIL_FROM || 'noreply@elearning.com';

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      throw createError('Failed to send email', 500);
    }
  }

  static async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to E-Learning Platform</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Welcome to E-Learning Platform!</h1>
            <p>Hi ${firstName},</p>
            <p>Thank you for joining our e-learning platform. We're excited to have you on board!</p>
            <p>You can now:</p>
            <ul>
              <li>Browse and enroll in courses</li>
              <li>Track your learning progress</li>
              <li>Take quizzes and assessments</li>
              <li>Connect with instructors and fellow students</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Happy learning!</p>
            <p>Best regards,<br>The E-Learning Team</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to E-Learning Platform',
      html,
    });
  }

  static async sendEnrollmentConfirmation(email: string, firstName: string, courseTitle: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Course Enrollment Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Enrollment Confirmed!</h1>
            <p>Hi ${firstName},</p>
            <p>Congratulations! You have been successfully enrolled in:</p>
            <h2 style="color: #3498db;">${courseTitle}</h2>
            <p>You can now access your course materials and start learning. Good luck with your studies!</p>
            <p>If you have any questions about the course, please don't hesitate to reach out to your instructor.</p>
            <p>Happy learning!</p>
            <p>Best regards,<br>The E-Learning Team</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Enrollment Confirmed: ${courseTitle}`,
      html,
    });
  }

  static async sendPaymentConfirmation(email: string, firstName: string, courseTitle: string, amount: number): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #27ae60;">Payment Confirmed!</h1>
            <p>Hi ${firstName},</p>
            <p>Your payment has been successfully processed.</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Payment Details:</h3>
              <p><strong>Course:</strong> ${courseTitle}</p>
              <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
              <p><strong>Status:</strong> Completed</p>
            </div>
            <p>You are now enrolled in the course and can start learning immediately!</p>
            <p>Thank you for choosing our platform.</p>
            <p>Best regards,<br>The E-Learning Team</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Payment Confirmation: ${courseTitle}`,
      html,
    });
  }

  static async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e74c3c;">Password Reset Request</h1>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3498db;">${resetUrl}</p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>The E-Learning Team</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
    });
  }

  static async sendQuizCompletionEmail(email: string, firstName: string, quizTitle: string, score: number, totalScore: number): Promise<void> {
    const percentage = Math.round((score / totalScore) * 100);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Quiz Completed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Quiz Completed!</h1>
            <p>Hi ${firstName},</p>
            <p>You have completed the quiz: <strong>${quizTitle}</strong></p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Your Results:</h3>
              <p><strong>Score:</strong> ${score}/${totalScore}</p>
              <p><strong>Percentage:</strong> ${percentage}%</p>
            </div>
            <p>Keep up the great work! Continue learning to improve your knowledge and skills.</p>
            <p>Best regards,<br>The E-Learning Team</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Quiz Completed: ${quizTitle}`,
      html,
    });
  }
}