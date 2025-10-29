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
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .email-card { background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; }
          .logo-img { max-height: 60px; max-width: 250px; margin: 0 auto 10px; display: block; }
          .success-banner { background: #d4edda; color: #155724; padding: 20px; text-align: center; border-bottom: 3px solid #c3e6cb; }
          .success-banner h2 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .amount-badge { background: #e8f5e9; color: #2e7d32; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #c3e6cb; }
          .amount-badge .amount { font-size: 32px; font-weight: bold; margin: 10px 0; }
          .details-section { margin: 25px 0; }
          .section-title { font-weight: bold; color: #1a1a2e; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; text-align: right; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; }
          .button { display: inline-block; background: #1a1a2e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-card">
            <!-- Header -->
            <div class="header">
              ${data.logoDataUri ? `
                <img src="${data.logoDataUri}" alt="USA Luxury Limo" class="logo-img" />
              ` : `
                <h1 style="margin: 0;">USA Luxury Limo</h1>
              `}
              <p style="margin: 10px 0 0 0;">Ride in Style, Always on Time</p>
            </div>

            <!-- Success Banner -->
            <div class="success-banner">
              <h2>✓ Payment Successful!</h2>
              <p style="margin: 10px 0 0 0;">Thank you for your payment</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p>Dear ${data.passengerName},</p>
              <p>Your payment has been processed successfully. Below is your payment confirmation.</p>

              <!-- Amount Paid -->
              <div class="amount-badge">
                <div style="font-size: 14px; color: #666;">Amount Paid</div>
                <div class="amount">$${parseFloat(data.amount).toFixed(2)}</div>
                <div style="font-size: 12px; color: #666;">Payment Date: ${data.paymentDate}</div>
              </div>

              <!-- Payment Details -->
              <div class="details-section">
                <div class="section-title">Payment Information</div>
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
                <div class="section-title">Journey Details</div>
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

              <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>📧 Receipt Sent</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #555;">
                  A detailed receipt has been sent to your email by Stripe.
                </p>
              </div>

              <p><strong>What's Next?</strong></p>
              <ul style="color: #555;">
                <li>Please be ready 10 minutes before your scheduled pickup time</li>
                <li>Our driver will contact you before arrival</li>
                <li>Save this email for your records</li>
              </ul>

              <p>If you have any questions or need to make changes to your booking, please contact us immediately.</p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p><strong>USA Luxury Limo</strong></p>
              <p>Your journey, our passion.</p>
              <p style="margin-top: 10px;">This is an automated confirmation email. Please do not reply.</p>
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

// Clear transporter cache (useful when settings are updated)
export function clearEmailCache() {
  cachedTransporter = null;
  lastSettingsCheck = 0;
}
