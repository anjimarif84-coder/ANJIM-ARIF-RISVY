import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';
import { EmailTemplate } from '@/types';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(template: EmailTemplate): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      
      logger.info(`Email sent successfully to ${template.to}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Welcome to ELearning Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Welcome to ELearning Platform!</h1>
          <p>Hi ${firstName},</p>
          <p>Thank you for joining our e-learning platform! We're excited to have you on board.</p>
          <p>You can now:</p>
          <ul>
            <li>Browse and enroll in courses</li>
            <li>Track your learning progress</li>
            <li>Take quizzes and earn certificates</li>
            <li>Connect with instructors and other students</li>
          </ul>
          <p>Get started by exploring our course catalog!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/courses" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Explore Courses
            </a>
          </div>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Happy learning!</p>
          <p>The ELearning Team</p>
        </div>
      `,
      text: `
        Welcome to ELearning Platform!
        
        Hi ${firstName},
        
        Thank you for joining our e-learning platform! We're excited to have you on board.
        
        You can now:
        - Browse and enroll in courses
        - Track your learning progress
        - Take quizzes and earn certificates
        - Connect with instructors and other students
        
        Get started by exploring our course catalog at ${process.env.FRONTEND_URL}/courses
        
        If you have any questions, feel free to contact our support team.
        
        Happy learning!
        The ELearning Team
      `,
    };

    await this.sendEmail(template);
  }

  async sendEnrollmentConfirmation(
    email: string, 
    firstName: string, 
    courseName: string,
    courseId: string
  ): Promise<void> {
    const template: EmailTemplate = {
      to: email,
      subject: `Enrollment Confirmed: ${courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Enrollment Confirmed!</h1>
          <p>Hi ${firstName},</p>
          <p>Congratulations! You have successfully enrolled in <strong>${courseName}</strong>.</p>
          <p>You now have access to all course materials, including:</p>
          <ul>
            <li>Video lessons</li>
            <li>Course materials and resources</li>
            <li>Quizzes and assignments</li>
            <li>Progress tracking</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/courses/${courseId}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Start Learning
            </a>
          </div>
          <p>Happy learning!</p>
          <p>The ELearning Team</p>
        </div>
      `,
    };

    await this.sendEmail(template);
  }

  async sendQuizCompletionEmail(
    email: string,
    firstName: string,
    quizTitle: string,
    score: number,
    passingScore: number,
    passed: boolean
  ): Promise<void> {
    const template: EmailTemplate = {
      to: email,
      subject: `Quiz Results: ${quizTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Quiz Completed!</h1>
          <p>Hi ${firstName},</p>
          <p>You have completed the quiz: <strong>${quizTitle}</strong></p>
          <div style="background-color: ${passed ? '#d4edda' : '#f8d7da'}; 
                      border: 1px solid ${passed ? '#c3e6cb' : '#f5c6cb'}; 
                      color: ${passed ? '#155724' : '#721c24'}; 
                      padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Your Results:</h3>
            <p><strong>Score:</strong> ${score}%</p>
            <p><strong>Passing Score:</strong> ${passingScore}%</p>
            <p><strong>Status:</strong> ${passed ? 'PASSED' : 'FAILED'}</p>
          </div>
          ${passed 
            ? '<p>Congratulations! You have successfully passed the quiz.</p>' 
            : '<p>Unfortunately, you did not pass this time. Don\'t worry, you can retake the quiz to improve your score.</p>'
          }
          <p>Keep up the great work!</p>
          <p>The ELearning Team</p>
        </div>
      `,
    };

    await this.sendEmail(template);
  }
}

export const emailService = new EmailService();