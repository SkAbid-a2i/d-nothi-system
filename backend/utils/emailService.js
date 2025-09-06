// utils/emailService.js
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to D-Nothi System',
      html: `
        <h1>Welcome to D-Nothi System, ${name}!</h1>
        <p>Your account has been successfully created.</p>
        <p>You can now login to the system using your credentials.</p>
        <br>
        <p>Best regards,<br>D-Nothi Team</p>
      `
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

const sendPasswordResetEmail = async (email, token) => {
  try {
    const transporter = createTransporter();
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <br>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail
};