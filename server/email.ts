import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { storage } from './storage';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

let cachedTransporter: Transporter | null = null;
let lastSettingsCheck = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getSMTPSettings(): Promise<SMTPSettings | null> {
  try {
    const [host, port, secure, user, password, fromEmail, fromName] = await Promise.all([
      storage.getSystemSetting('SMTP_HOST'),
      storage.getSystemSetting('SMTP_PORT'),
      storage.getSystemSetting('SMTP_SECURE'),
      storage.getSystemSetting('SMTP_USER'),
      storage.getSystemSetting('SMTP_PASSWORD'),
      storage.getSystemSetting('SMTP_FROM_EMAIL'),
      storage.getSystemSetting('SMTP_FROM_NAME'),
    ]);

    if (!host?.value || !port?.value || !user?.value || !password?.value || !fromEmail?.value) {
      return null;
    }

    return {
      host: host.value,
      port: parseInt(port.value),
      secure: secure?.value === 'true',
      user: user.value,
      password: password.value,
      fromEmail: fromEmail.value,
      fromName: fromName?.value || 'USA Luxury Limo',
    };
  } catch (error) {
    console.error('Error fetching SMTP settings:', error);
    return null;
  }
}

async function getTransporter(): Promise<Transporter | null> {
  const now = Date.now();
  
  // Return cached transporter if still valid
  if (cachedTransporter && (now - lastSettingsCheck) < CACHE_DURATION) {
    return cachedTransporter;
  }

  const settings = await getSMTPSettings();
  
  if (!settings) {
    console.log('SMTP settings not configured');
    return null;
  }

  try {
    const transportConfig: any = {
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.user,
        pass: settings.password,
      },
    };

    // For port 587 with STARTTLS, force TLS upgrade
    if (settings.port === 587 && !settings.secure) {
      transportConfig.requireTLS = true;
    }

    cachedTransporter = nodemailer.createTransport(transportConfig);

    lastSettingsCheck = now;
    return cachedTransporter;
  } catch (error) {
    console.error('Error creating SMTP transporter:', error);
    return null;
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    
    if (!transporter) {
      console.error('Email transporter not available - check SMTP settings');
      return false;
    }

    const settings = await getSMTPSettings();
    if (!settings) {
      return false;
    }

    const mailOptions = {
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function testSMTPConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = await getTransporter();
    
    if (!transporter) {
      return {
        success: false,
        message: 'SMTP settings are not configured. Please configure SMTP settings first.',
      };
    }

    await transporter.verify();
    
    return {
      success: true,
      message: 'SMTP connection successful! Email server is ready to send emails.',
    };
  } catch (error: any) {
    console.error('SMTP connection test failed:', error);
    return {
      success: false,
      message: `SMTP connection failed: ${error.message || 'Unknown error'}`,
    };
  }
}

// Email Templates

export function getContactFormEmailHTML(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null | undefined;
  serviceType: string | null | undefined;
  message: string;
  submittedAt: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .field { margin-bottom: 20px; }
          .field-label { font-weight: bold; color: #555; margin-bottom: 5px; }
          .field-value { background: white; padding: 12px; border-radius: 4px; border: 1px solid #e0e0e0; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚗 New Contact Form Submission</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">From:</div>
              <div class="field-value">${data.firstName} ${data.lastName}</div>
            </div>
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value"><a href="mailto:${data.email}">${data.email}</a></div>
            </div>
            ${data.phone ? `
            <div class="field">
              <div class="field-label">Phone:</div>
              <div class="field-value"><a href="tel:${data.phone}">${data.phone}</a></div>
            </div>
            ` : ''}
            ${data.serviceType ? `
            <div class="field">
              <div class="field-label">Service Type:</div>
              <div class="field-value">${data.serviceType}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="field-label">Message:</div>
              <div class="field-value" style="white-space: pre-wrap;">${data.message}</div>
            </div>
            <div class="field">
              <div class="field-label">Submitted At:</div>
              <div class="field-value">${data.submittedAt}</div>
            </div>
          </div>
          <div class="footer">
            <p>This email was sent from the USA Luxury Limo contact form.</p>
            <p>Please respond to the customer at <a href="mailto:${data.email}">${data.email}</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getBookingConfirmationEmailHTML(data: {
  passengerName: string;
  bookingId: string;
  pickupAddress: string;
  destinationAddress: string;
  scheduledDateTime: string;
  vehicleType: string;
  totalAmount: string;
  status: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .total-amount { font-size: 24px; font-weight: bold; color: #1a1a2e; text-align: center; margin: 20px 0; padding: 20px; background: #fff3cd; border-radius: 8px; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Booking Confirmation</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.passengerName},</p>
            <p>Thank you for choosing USA Luxury Limo! Your booking has been confirmed.</p>
            
            <div class="booking-details">
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${data.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Location:</span>
                <span class="detail-value">${data.pickupAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destination:</span>
                <span class="detail-value">${data.destinationAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Scheduled Date & Time:</span>
                <span class="detail-value">${data.scheduledDateTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle Type:</span>
                <span class="detail-value">${data.vehicleType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${data.status.toUpperCase()}</span>
              </div>
            </div>

            <div class="total-amount">
              Total Amount: $${data.totalAmount}
            </div>

            <p><strong>Important Information:</strong></p>
            <ul>
              <li>Please be ready 10 minutes before your scheduled pickup time</li>
              <li>Our driver will contact you before arrival</li>
              <li>For any changes or cancellations, please contact us immediately</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>Your journey, our passion.</p>
            <p>For support, please contact us through our website.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getBookingStatusUpdateEmailHTML(data: {
  passengerName: string;
  bookingId: string;
  oldStatus: string;
  newStatus: string;
  pickupAddress: string;
  scheduledDateTime: string;
}): string {
  const statusEmoji = {
    pending: '⏳',
    confirmed: '✅',
    in_progress: '🚗',
    completed: '🏁',
    cancelled: '❌',
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .status-update { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .status-badge { display: inline-block; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 10px; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📋 Booking Status Update</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.passengerName},</p>
            <p>Your booking status has been updated.</p>
            
            <div class="status-update">
              <h3>Booking ID: ${data.bookingId}</h3>
              <p>
                <span class="status-badge" style="background: #ffebee; color: #c62828;">${statusEmoji[data.oldStatus as keyof typeof statusEmoji] || ''} ${data.oldStatus.toUpperCase()}</span>
                <span style="font-size: 24px;">→</span>
                <span class="status-badge" style="background: #e8f5e9; color: #2e7d32;">${statusEmoji[data.newStatus as keyof typeof statusEmoji] || ''} ${data.newStatus.toUpperCase()}</span>
              </p>
              <p style="margin-top: 20px;"><strong>Pickup:</strong> ${data.pickupAddress}</p>
              <p><strong>Scheduled:</strong> ${data.scheduledDateTime}</p>
            </div>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>For questions or support, please contact us through our website.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getDriverAssignmentEmailHTML(data: {
  driverName: string;
  bookingId: string;
  passengerName: string;
  passengerPhone: string;
  pickupAddress: string;
  destinationAddress: string;
  scheduledDateTime: string;
  vehicleType: string;
  driverPayment?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .ride-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; display: block; margin-bottom: 5px; }
          .detail-value { color: #333; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚗 New Ride Assignment</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.driverName},</p>
            <p>You have been assigned a new ride. Please review the details below:</p>
            
            <div class="ride-details">
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${data.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Passenger Name:</span>
                <span class="detail-value">${data.passengerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Passenger Phone:</span>
                <span class="detail-value"><a href="tel:${data.passengerPhone}">${data.passengerPhone}</a></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Location:</span>
                <span class="detail-value">${data.pickupAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destination:</span>
                <span class="detail-value">${data.destinationAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Scheduled Date & Time:</span>
                <span class="detail-value">${data.scheduledDateTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle Type:</span>
                <span class="detail-value">${data.vehicleType}</span>
              </div>
              ${data.driverPayment ? `
              <div class="detail-row" style="background: #e8f5e9; margin-top: 10px; padding: 15px; border-radius: 4px;">
                <span class="detail-label" style="color: #2e7d32; font-size: 16px;">💰 Your Payment for this Ride:</span>
                <span class="detail-value" style="color: #2e7d32; font-size: 20px; font-weight: bold;">$${data.driverPayment}</span>
              </div>
              ` : ''}
            </div>

            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Please confirm your availability immediately</li>
              <li>Prepare the assigned vehicle</li>
              <li>Contact the passenger 30 minutes before pickup</li>
              <li>Arrive 10 minutes before scheduled time</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>Drive safely and provide excellent service!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getPasswordResetEmailHTML(data: {
  name: string;
  resetLink: string;
  expiresIn: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔐 Password Reset Request</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Hello ${data.name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${data.resetLink}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: #fff; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
              ${data.resetLink}
            </p>
            
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
              <ul style="margin: 10px 0 0 0;">
                <li>This link will expire in ${data.expiresIn}</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password won't change until you click the link and create a new one</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getPaymentConfirmationEmailHTML(data: {
  passengerName: string;
  invoiceNumber: string;
  bookingId: string;
  amount: string;
  paymentDate: string;
  pickupAddress: string;
  destinationAddress?: string;
  scheduledDateTime: string;
  paymentIntentId: string;
  logoDataUri?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #1e293b; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
          }
          .email-wrapper { max-width: 680px; margin: 0 auto; }
          .email-card { 
            background: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          }
          
          /* Header with Logo */
          .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%);
          }
          .logo-container {
            background: white;
            padding: 15px 30px;
            border-radius: 12px;
            display: inline-block;
            margin-bottom: 15px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .logo-img { 
            max-height: 50px; 
            max-width: 220px; 
            display: block;
          }
          .company-name {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
          }
          .tagline {
            color: rgba(255, 255, 255, 0.95);
            font-size: 15px;
            margin-top: 8px;
            font-weight: 500;
            letter-spacing: 0.5px;
          }
          
          /* Success Banner */
          .success-banner {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border-left: 5px solid #10b981;
            padding: 25px 30px;
            text-align: center;
          }
          .success-icon {
            width: 60px;
            height: 60px;
            background: #10b981;
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          .success-title {
            font-size: 26px;
            font-weight: 700;
            color: #065f46;
            margin-bottom: 5px;
          }
          .success-subtitle {
            color: #047857;
            font-size: 15px;
          }
          
          /* Content Area */
          .content { 
            padding: 40px 30px;
            background: #ffffff;
          }
          .greeting {
            font-size: 17px;
            color: #334155;
            margin-bottom: 12px;
            font-weight: 600;
          }
          .intro-text {
            color: #64748b;
            margin-bottom: 30px;
            font-size: 15px;
          }
          
          /* Amount Card */
          .amount-card {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 2px solid #93c5fd;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
          }
          .amount-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #3b82f6;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .amount-value {
            font-size: 48px;
            font-weight: 800;
            color: #1d4ed8;
            margin: 10px 0;
            letter-spacing: -1px;
          }
          .amount-date {
            font-size: 13px;
            color: #64748b;
            margin-top: 10px;
          }
          
          /* Details Section */
          .details-section {
            margin: 35px 0;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
          }
          .section-header {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            padding: 15px 20px;
            border-bottom: 2px solid #cbd5e1;
          }
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section-icon {
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            align-items: flex-start;
          }
          .detail-row:last-child { border-bottom: none; }
          .detail-label {
            font-weight: 600;
            color: #64748b;
            font-size: 14px;
            flex: 0 0 40%;
          }
          .detail-value {
            color: #1e293b;
            text-align: right;
            font-size: 14px;
            flex: 1;
            font-weight: 500;
          }
          
          /* Info Box */
          .info-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .info-title {
            font-size: 15px;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .info-text {
            font-size: 13px;
            color: #78350f;
            line-height: 1.5;
          }
          
          /* What's Next Section */
          .next-steps {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
          }
          .next-steps-title {
            font-size: 17px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .next-steps ul {
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .next-steps li {
            padding: 10px 0;
            padding-left: 30px;
            position: relative;
            color: #475569;
            font-size: 14px;
            line-height: 1.6;
          }
          .next-steps li:before {
            content: '✓';
            position: absolute;
            left: 0;
            top: 10px;
            width: 20px;
            height: 20px;
            background: #10b981;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }
          
          /* Footer */
          .footer {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 30px;
            text-align: center;
            border-top: 3px solid #e2e8f0;
          }
          .footer-logo {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
          }
          .footer-tagline {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 15px;
            font-style: italic;
          }
          .footer-note {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
          }
          
          /* Responsive */
          @media only screen and (max-width: 600px) {
            body { padding: 10px; }
            .content, .success-banner { padding: 25px 20px; }
            .header { padding: 30px 20px; }
            .amount-value { font-size: 36px; }
            .detail-row { flex-direction: column; gap: 5px; }
            .detail-label, .detail-value { flex: 1; text-align: left; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-card">
            <!-- Header with Logo -->
            <div class="header">
              ${data.logoDataUri ? `
                <div class="logo-container">
                  <img src="${data.logoDataUri}" alt="USA Luxury Limo" class="logo-img" />
                </div>
              ` : `
                <div class="logo-container">
                  <h1 class="company-name">USA LUXURY LIMO</h1>
                </div>
              `}
              <p class="tagline">Ride in Style, Always on Time</p>
            </div>

            <!-- Success Banner -->
            <div class="success-banner">
              <div class="success-icon">✓</div>
              <h2 class="success-title">Payment Successful!</h2>
              <p class="success-subtitle">Thank you for choosing USA Luxury Limo</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p class="greeting">Dear ${data.passengerName},</p>
              <p class="intro-text">Your payment has been processed successfully. Below is your payment confirmation and booking details.</p>

              <!-- Amount Paid -->
              <div class="amount-card">
                <div class="amount-label">Total Amount Paid</div>
                <div class="amount-value">$${parseFloat(data.amount).toFixed(2)}</div>
                <div class="amount-date">Payment Date: ${data.paymentDate}</div>
              </div>

              <!-- Payment Information -->
              <div class="details-section">
                <div class="section-header">
                  <div class="section-title">
                    <span class="section-icon">💳</span>
                    Payment Information
                  </div>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Invoice Number</span>
                  <span class="detail-value">${data.invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking Reference</span>
                  <span class="detail-value">#${data.bookingId.toUpperCase().substring(0, 8)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Transaction ID</span>
                  <span class="detail-value">${data.paymentIntentId.substring(0, 20)}...</span>
                </div>
              </div>

              <!-- Journey Details -->
              <div class="details-section">
                <div class="section-header">
                  <div class="section-title">
                    <span class="section-icon">🚗</span>
                    Journey Details
                  </div>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Scheduled Date & Time</span>
                  <span class="detail-value">${new Date(data.scheduledDateTime).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Pickup Location</span>
                  <span class="detail-value">${data.pickupAddress}</span>
                </div>
                ${data.destinationAddress ? `
                <div class="detail-row">
                  <span class="detail-label">Destination</span>
                  <span class="detail-value">${data.destinationAddress}</span>
                </div>
                ` : ''}
              </div>

              <!-- Receipt Notice -->
              <div class="info-box">
                <div class="info-title">
                  <span>📧</span> Receipt Sent
                </div>
                <p class="info-text">
                  A detailed payment receipt has been sent to your email by Stripe for your records.
                </p>
              </div>

              <!-- What's Next -->
              <div class="next-steps">
                <div class="next-steps-title">
                  <span>📋</span> What's Next?
                </div>
                <ul>
                  <li>Please be ready 10 minutes before your scheduled pickup time</li>
                  <li>Our professional driver will contact you prior to arrival</li>
                  <li>Save this confirmation email for your records</li>
                  <li>Contact us immediately if you need to make any changes</li>
                </ul>
              </div>

              <p style="color: #64748b; font-size: 14px; margin-top: 25px;">
                If you have any questions or concerns about your booking, please don't hesitate to contact our customer support team.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p class="footer-logo">USA LUXURY LIMO</p>
              <p class="footer-tagline">Your Journey, Our Passion</p>
              <p class="footer-note">
                This is an automated confirmation email. Please do not reply directly to this message.<br>
                For support, please contact our customer service team.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getTestEmailHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .success-badge { background: #e8f5e9; color: #2e7d32; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; margin: 20px 0; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ SMTP Test Email</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <div class="success-badge">
              🎉 Congratulations! Your SMTP configuration is working correctly.
            </div>
            <p>This is a test email to verify that your email sending functionality is properly configured.</p>
            <p><strong>What this means:</strong></p>
            <ul>
              <li>Your SMTP settings are correct</li>
              <li>Email server connection is successful</li>
              <li>You can now send automated emails to your customers</li>
            </ul>
            <p>Your USA Luxury Limo system is now ready to send:</p>
            <ul>
              <li>Contact form notifications</li>
              <li>Booking confirmations</li>
              <li>Status update notifications</li>
              <li>Driver assignment alerts</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo Email System</strong></p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getDriverOnTheWayEmailHTML(data: {
  passengerName: string;
  bookingId: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  pickupAddress: string;
  scheduledDateTime: string;
  estimatedArrival?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .alert-banner { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 5px solid #2563eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .driver-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; display: block; margin-bottom: 5px; }
          .detail-value { color: #333; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚗 Driver On The Way!</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.passengerName},</p>
            
            <div class="alert-banner">
              <h3 style="margin-top: 0; color: #1e40af;">Your driver is on the way to pick you up!</h3>
              <p style="margin-bottom: 0; font-size: 16px;">${data.estimatedArrival ? `Estimated arrival: <strong>${data.estimatedArrival}</strong>` : 'Please be ready for pickup.'}</p>
            </div>
            
            <div class="driver-info">
              <h3 style="margin-top: 0;">Driver Information</h3>
              <div class="detail-row">
                <span class="detail-label">Driver Name:</span>
                <span class="detail-value">${data.driverName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact Number:</span>
                <span class="detail-value"><a href="tel:${data.driverPhone}">${data.driverPhone}</a></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle Type:</span>
                <span class="detail-value">${data.vehicleType}</span>
              </div>
            </div>

            <div class="driver-info">
              <h3 style="margin-top: 0;">Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${data.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Location:</span>
                <span class="detail-value">${data.pickupAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Scheduled Time:</span>
                <span class="detail-value">${data.scheduledDateTime}</span>
              </div>
            </div>

            <p><strong>Please Note:</strong></p>
            <ul>
              <li>Be ready and waiting at your pickup location</li>
              <li>Keep your phone nearby in case the driver needs to contact you</li>
              <li>Have your luggage ready for a smooth pickup</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>Your journey, our passion.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getDriverArrivedEmailHTML(data: {
  passengerName: string;
  bookingId: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  pickupAddress: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .alert-banner { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-left: 5px solid #16a34a; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .driver-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; display: block; margin-bottom: 5px; }
          .detail-value { color: #333; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📍 Driver Has Arrived!</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.passengerName},</p>
            
            <div class="alert-banner">
              <h2 style="margin: 0; color: #15803d; font-size: 24px;">✓ Your driver has arrived at the pickup location!</h2>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Please proceed to your vehicle.</p>
            </div>
            
            <div class="driver-info">
              <h3 style="margin-top: 0;">Driver Information</h3>
              <div class="detail-row">
                <span class="detail-label">Driver Name:</span>
                <span class="detail-value">${data.driverName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact Number:</span>
                <span class="detail-value"><a href="tel:${data.driverPhone}">${data.driverPhone}</a></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle Type:</span>
                <span class="detail-value">${data.vehicleType}</span>
              </div>
            </div>

            <div class="driver-info">
              <h3 style="margin-top: 0;">Pickup Location</h3>
              <p style="margin: 0; padding: 15px; background: #fef3c7; border-radius: 4px;">
                📍 ${data.pickupAddress}
              </p>
            </div>

            <p><strong>What to do next:</strong></p>
            <ul>
              <li>Proceed to the pickup location immediately</li>
              <li>Look for your ${data.vehicleType}</li>
              <li>Contact the driver if you have trouble locating the vehicle</li>
              <li>Have your belongings ready to load</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>Enjoy your ride!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getBookingCancelledEmailHTML(data: {
  passengerName: string;
  bookingId: string;
  pickupAddress: string;
  destinationAddress?: string;
  scheduledDateTime: string;
  cancelReason?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .alert-box { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">❌ Booking Cancelled</h1>
            <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
          </div>
          <div class="content">
            <p>Dear ${data.passengerName},</p>
            
            <div class="alert-box">
              <h3 style="margin-top: 0; color: #dc2626;">Your booking has been cancelled</h3>
              <p>Booking ID: <strong>${data.bookingId}</strong></p>
              ${data.cancelReason ? `
              <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 4px;">
                <strong>Cancellation Reason:</strong><br>
                ${data.cancelReason}
              </div>
              ` : ''}
            </div>
            
            <div class="booking-details">
              <h3 style="margin-top: 0;">Cancelled Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${data.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pickup Location:</span>
                <span class="detail-value">${data.pickupAddress}</span>
              </div>
              ${data.destinationAddress ? `
              <div class="detail-row">
                <span class="detail-label">Destination:</span>
                <span class="detail-value">${data.destinationAddress}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Scheduled Date & Time:</span>
                <span class="detail-value">${data.scheduledDateTime}</span>
              </div>
            </div>

            <p>If you need to make a new booking, please visit our website or contact us directly.</p>
            <p>If you believe this cancellation was made in error, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p><strong>USA Luxury Limo</strong></p>
            <p>We hope to serve you again in the future.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Clear transporter cache (useful when settings are updated)
export function clearEmailCache() {
  cachedTransporter = null;
  lastSettingsCheck = 0;
}
