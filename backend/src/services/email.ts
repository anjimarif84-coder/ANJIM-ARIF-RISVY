import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransporter({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: config.FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', options.to);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email: string, firstName: string): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to E-Learning Platform!</h2>
      <p>Hi ${firstName},</p>
      <p>Thank you for joining our e-learning platform. We're excited to have you on board!</p>
      <p>You can now:</p>
      <ul>
        <li>Browse and enroll in courses</li>
        <li>Track your learning progress</li>
        <li>Take quizzes and assessments</li>
        <li>Connect with instructors and other students</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Happy learning!</p>
      <p>Best regards,<br>The E-Learning Team</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to E-Learning Platform!',
    html,
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested a password reset for your account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <p>Best regards,<br>The E-Learning Team</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html,
  });
};