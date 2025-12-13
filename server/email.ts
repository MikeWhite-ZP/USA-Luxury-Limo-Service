import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { storage } from './storage';

function getAppBaseUrl(): string {
  if (process.env.ALLOWED_ORIGINS) {
    const origins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    const mainOrigin = origins.find(o => !o.includes('admin') && !o.includes('api') && !o.includes('www.'));
    return mainOrigin || origins[0];
  }
  if (process.env.COOLIFY_URL) {
    const urls = process.env.COOLIFY_URL.split(',').map(u => u.trim());
    const mainUrl = urls.find(u => !u.includes('admin') && !u.includes('api') && !u.includes('www.'));
    return mainUrl || urls[0];
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return process.env.REPLIT_DEV_DOMAIN.trim();
  }
  return 'http://localhost:5000';
}

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

interface BrandingInfo {
  companyName: string;
  logoUrl: string | null;
}

let cachedBranding: BrandingInfo | null = null;
let lastBrandingCheck = 0;
const BRANDING_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getBrandingInfo(): Promise<BrandingInfo> {
  const now = Date.now();
  
  if (cachedBranding && (now - lastBrandingCheck) < BRANDING_CACHE_DURATION) {
    return cachedBranding;
  }
  
  try {
    const [brandName, logoUrl] = await Promise.all([
      storage.getCmsSetting('BRAND_NAME'),
      storage.getCmsSetting('BRAND_LOGO_URL'),
    ]);
    
    cachedBranding = {
      companyName: brandName?.value || 'Luxury Transportation',
      logoUrl: logoUrl?.value || null,
    };
    
    lastBrandingCheck = now;
    return cachedBranding;
  } catch (error) {
    console.error('Error fetching branding info:', error);
    return {
      companyName: 'Luxury Transportation',
      logoUrl: null,
    };
  }
}

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

    const branding = await getBrandingInfo();

    return {
      host: host.value,
      port: parseInt(port.value),
      secure: secure?.value === 'true',
      user: user.value,
      password: password.value,
      fromEmail: fromEmail.value,
      fromName: fromName?.value || branding.companyName,
    };
  } catch (error) {
    console.error('Error fetching SMTP settings:', error);
    return null;
  }
}

async function getTransporter(): Promise<Transporter | null> {
  const now = Date.now();
  
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
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
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

const emailStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f1f3f5; margin: 0; padding: 20px; }
  .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .email-header { background: #ffffff; padding: 32px; text-align: center; border-bottom: 1px solid #e9ecef; }
  .logo { max-height: 60px; max-width: 200px; }
  .email-title { font-size: 24px; font-weight: 600; color: #212529; margin: 16px 0 0 0; }
  .email-body { padding: 32px; background: #ffffff; }
  .greeting { font-size: 16px; color: #333333; margin-bottom: 16px; }
  .intro-text { color: #495057; margin-bottom: 24px; }
  .info-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 16px 0; border: 1px solid #e9ecef; }
  .info-row { padding: 12px 0; border-bottom: 1px solid #e9ecef; }
  .info-row:last-child { border-bottom: none; }
  .info-label { font-weight: 600; color: #495057; display: block; margin-bottom: 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-value { color: #212529; font-size: 15px; }
  .info-value a { color: #228be6; text-decoration: none; }
  .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; }
  .status-confirmed { background: #d3f9d8; color: #2b8a3e; }
  .status-pending { background: #fff3cd; color: #856404; }
  .status-cancelled { background: #ffe3e3; color: #c92a2a; }
  .status-in_progress { background: #e7f5ff; color: #1971c2; }
  .status-completed { background: #d3f9d8; color: #2b8a3e; }
  .amount-box { background: #e7f5ff; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; border: 1px solid #a5d8ff; }
  .amount-label { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #1971c2; font-weight: 600; margin-bottom: 8px; }
  .amount { font-size: 32px; font-weight: 700; color: #1971c2; }
  .alert-box { border-radius: 8px; padding: 20px; margin: 20px 0; }
  .alert-info { background: #e7f5ff; border-left: 4px solid #228be6; }
  .alert-success { background: #d3f9d8; border-left: 4px solid #2b8a3e; }
  .alert-warning { background: #fff3cd; border-left: 4px solid #f59f00; }
  .alert-danger { background: #ffe3e3; border-left: 4px solid #c92a2a; }
  .btn { display: inline-block; padding: 14px 28px; background: #228be6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
  .btn:hover { background: #1c7ed6; }
  .section-title { font-size: 16px; font-weight: 600; color: #212529; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #e9ecef; }
  .list-item { padding: 8px 0; color: #495057; }
  .email-footer { background: #f8f9fa; padding: 24px; text-align: center; color: #6c757d; font-size: 13px; border-top: 1px solid #e9ecef; }
  .footer-company { font-weight: 600; color: #495057; margin-bottom: 4px; }
  .footer-tagline { color: #868e96; font-style: italic; }
  @media only screen and (max-width: 600px) {
    body { padding: 10px; }
    .email-header, .email-body { padding: 24px; }
    .amount { font-size: 28px; }
  }
`;

function getLogoHeader(logoUrl: string | null, company: string): string {
  return logoUrl 
    ? `<img src="${logoUrl}" alt="${company}" class="logo" style="max-height: 60px; max-width: 200px;">`
    : `<div style="font-size: 24px; font-weight: 700; color: #212529;">${company}</div>`;
}

export async function getContactFormEmailHTML(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null | undefined;
  serviceType: string | null | undefined;
  message: string;
  submittedAt: string;
}): Promise<string> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">New Contact Form Submission</h1>
          </div>
          <div class="email-body">
            <p class="intro-text">You have received a new contact form submission. Please review the details below:</p>
            
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">From</span>
                <span class="info-value">${data.firstName} ${data.lastName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value"><a href="mailto:${data.email}">${data.email}</a></span>
              </div>
              ${data.phone ? `
              <div class="info-row">
                <span class="info-label">Phone</span>
                <span class="info-value"><a href="tel:${data.phone}">${data.phone}</a></span>
              </div>
              ` : ''}
              ${data.serviceType ? `
              <div class="info-row">
                <span class="info-label">Service Type</span>
                <span class="info-value">${data.serviceType}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Submitted At</span>
                <span class="info-value">${data.submittedAt}</span>
              </div>
            </div>

            <div class="info-card">
              <h3 class="section-title">Message</h3>
              <p style="margin: 0; white-space: pre-wrap; color: #333333;">${data.message}</p>
            </div>

            <div class="alert-box alert-info">
              <p style="margin: 0; color: #1971c2;"><strong>Action Required:</strong> Please respond to the customer at <a href="mailto:${data.email}" style="color: #1971c2;">${data.email}</a></p>
            </div>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p class="footer-tagline">Contact Form Notification</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function getBookingConfirmationEmailHTML(data: {
  passengerName: string;
  bookingId: string;
  pickupAddress: string;
  destinationAddress: string;
  scheduledDateTime: string;
  vehicleType: string;
  totalAmount: string;
  status: string;
}): Promise<string> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">Booking Confirmation</h1>
          </div>
          <div class="email-body">
            <p class="greeting">Dear ${data.passengerName},</p>
            <p class="intro-text">Thank you for choosing ${company}! Your booking has been confirmed.</p>
            
            <div class="alert-box alert-success">
              <p style="margin: 0; color: #2b8a3e; font-weight: 600; font-size: 16px;">✓ Your booking is confirmed</p>
            </div>

            <div class="info-card">
              <h3 class="section-title">Booking Details</h3>
              <div class="info-row">
                <span class="info-label">Booking ID</span>
                <span class="info-value">${data.bookingId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pickup Location</span>
                <span class="info-value">${data.pickupAddress}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Destination</span>
                <span class="info-value">${data.destinationAddress}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date & Time</span>
                <span class="info-value">${data.scheduledDateTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vehicle Type</span>
                <span class="info-value">${data.vehicleType}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value"><span class="status-badge status-${data.status}">${data.status.toUpperCase()}</span></span>
              </div>
            </div>

            <div class="amount-box">
              <div class="amount-label">Total Amount</div>
              <div class="amount">$${data.totalAmount}</div>
            </div>

            <div class="info-card">
              <h3 class="section-title">Important Information</h3>
              <div class="list-item">• Please be ready 10 minutes before your scheduled pickup time</div>
              <div class="list-item">• Our driver will contact you before arrival</div>
              <div class="list-item">• For any changes or cancellations, please contact us immediately</div>
            </div>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p class="footer-tagline">Your journey, our passion</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function getBookingStatusUpdateEmailHTML(data: {
  passengerName: string;
  bookingId: string;
  oldStatus: string;
  newStatus: string;
  pickupAddress: string;
  scheduledDateTime: string;
}): Promise<string> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  
  const statusEmoji: Record<string, string> = {
    pending: '⏳',
    confirmed: '✓',
    in_progress: '🚗',
    completed: '✓',
    cancelled: '✕',
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">Booking Status Update</h1>
          </div>
          <div class="email-body">
            <p class="greeting">Dear ${data.passengerName},</p>
            <p class="intro-text">Your booking status has been updated.</p>
            
            <div class="info-card" style="text-align: center;">
              <p style="margin: 0 0 16px 0; color: #495057; font-size: 14px;">Booking ID: <strong>${data.bookingId}</strong></p>
              <div style="display: inline-block; vertical-align: middle;">
                <span class="status-badge status-${data.oldStatus}">${statusEmoji[data.oldStatus] || ''} ${data.oldStatus.toUpperCase()}</span>
              </div>
              <span style="display: inline-block; padding: 0 16px; font-size: 24px; color: #adb5bd; vertical-align: middle;">→</span>
              <div style="display: inline-block; vertical-align: middle;">
                <span class="status-badge status-${data.newStatus}">${statusEmoji[data.newStatus] || ''} ${data.newStatus.toUpperCase()}</span>
              </div>
            </div>

            <div class="info-card">
              <h3 class="section-title">Booking Details</h3>
              <div class="info-row">
                <span class="info-label">Pickup Location</span>
                <span class="info-value">${data.pickupAddress}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Scheduled Date & Time</span>
                <span class="info-value">${data.scheduledDateTime}</span>
              </div>
            </div>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p class="footer-tagline">For questions, please contact us through our website</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function getDriverAssignmentEmailHTML(data: {
  driverName: string;
  bookingId: string;
  passengerName: string;
  passengerPhone: string;
  pickupAddress: string;
  destinationAddress: string;
  scheduledDateTime: string;
  vehicleType: string;
  driverPayment?: string;
}): Promise<string> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">New Ride Assignment</h1>
          </div>
          <div class="email-body">
            <p class="greeting">Dear ${data.driverName},</p>
            <p class="intro-text">You have been assigned a new ride. Please review the details below:</p>
            
            <div class="alert-box alert-info">
              <p style="margin: 0; color: #1971c2; font-weight: 600;">New ride assigned - Please confirm your availability</p>
            </div>

            <div class="info-card">
              <h3 class="section-title">Passenger Information</h3>
              <div class="info-row">
                <span class="info-label">Passenger Name</span>
                <span class="info-value">${data.passengerName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contact Number</span>
                <span class="info-value"><a href="tel:${data.passengerPhone}">${data.passengerPhone}</a></span>
              </div>
            </div>

            <div class="info-card">
              <h3 class="section-title">Ride Details</h3>
              <div class="info-row">
                <span class="info-label">Booking ID</span>
                <span class="info-value">${data.bookingId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pickup Location</span>
                <span class="info-value">${data.pickupAddress}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Destination</span>
                <span class="info-value">${data.destinationAddress}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date & Time</span>
                <span class="info-value">${data.scheduledDateTime}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vehicle Type</span>
                <span class="info-value">${data.vehicleType}</span>
              </div>
            </div>

            ${data.driverPayment ? `
            <div class="amount-box" style="background: #d3f9d8; border-color: #8ce99a;">
              <div class="amount-label" style="color: #2b8a3e;">Your Payment for this Ride</div>
              <div class="amount" style="color: #2b8a3e;">$${data.driverPayment}</div>
            </div>
            ` : ''}

            <div class="info-card">
              <h3 class="section-title">Action Required</h3>
              <div class="list-item">• Please confirm your availability immediately</div>
              <div class="list-item">• Prepare the assigned vehicle</div>
              <div class="list-item">• Contact the passenger 30 minutes before pickup</div>
              <div class="list-item">• Arrive 10 minutes before scheduled time</div>
            </div>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p class="footer-tagline">Drive safely and provide excellent service!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function getPasswordResetEmailHTML(data: {
  name: string;
  resetLink: string;
  expiresIn: string;
}): Promise<string> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">Password Reset Request</h1>
          </div>
          <div class="email-body">
            <p class="greeting">Hello ${data.name},</p>
            <p class="intro-text">We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${data.resetLink}" class="btn" style="color: #ffffff;">Reset Password</a>
            </div>
            
            <div class="info-card">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #495057;"><strong>Or copy and paste this link:</strong></p>
              <p style="margin: 0; word-break: break-all; font-size: 12px; color: #6c757d; background: #ffffff; padding: 12px; border-radius: 4px; border: 1px solid #e9ecef;">
                ${data.resetLink}
              </p>
            </div>
            
            <div class="alert-box alert-warning">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #856404;">⚠️ Important</p>
              <div style="color: #856404; font-size: 14px;">
                <div class="list-item">• This link will expire in ${data.expiresIn}</div>
                <div class="list-item">• If you didn't request this reset, please ignore this email</div>
                <div class="list-item">• Your password won't change until you click the link and create a new one</div>
              </div>
            </div>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p class="footer-tagline">If you have any questions, please contact our support team</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function getPaymentConfirmationEmailHTML(data: {
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
}): Promise<string> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = data.logoDataUri || branding.logoUrl;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">Payment Confirmation</h1>
          </div>
          <div class="email-body">
            <div class="alert-box alert-success" style="text-align: center;">
              <p style="margin: 0; font-size: 20px; font-weight: 600; color: #2b8a3e;">✓ Payment Successful!</p>
              <p style="margin: 8px 0 0 0; color: #2b8a3e;">Thank you for choosing ${company}</p>
            </div>

            <p class="greeting">Dear ${data.passengerName},</p>
            <p class="intro-text">Your payment has been processed successfully. Below is your payment confirmation and booking details.</p>

            <div class="amount-box">
              <div class="amount-label">Total Amount Paid</div>
              <div class="amount">$${parseFloat(data.amount).toFixed(2)}</div>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #495057;">Payment Date: ${data.paymentDate}</p>
            </div>

            <div class="info-card">
              <h3 class="section-title">Payment Information</h3>
              <div class="info-row">
                <span class="info-label">Invoice Number</span>
                <span class="info-value">${data.invoiceNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Booking Reference</span>
                <span class="info-value">#${data.bookingId.toUpperCase().substring(0, 8)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Transaction ID</span>
                <span class="info-value">${data.paymentIntentId.substring(0, 20)}...</span>
              </div>
            </div>

            <div class="info-card">
              <h3 class="section-title">Journey Details</h3>
              <div class="info-row">
                <span class="info-label">Date & Time</span>
                <span class="info-value">${new Date(data.scheduledDateTime).toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pickup Location</span>
                <span class="info-value">${data.pickupAddress}</span>
              </div>
              ${data.destinationAddress ? `
              <div class="info-row">
                <span class="info-label">Destination</span>
                <span class="info-value">${data.destinationAddress}</span>
              </div>
              ` : ''}
            </div>

            <div class="alert-box alert-info">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #1971c2;">📧 Receipt Sent</p>
              <p style="margin: 0; color: #1971c2; font-size: 14px;">A detailed payment receipt has been sent to your email by Stripe for your records.</p>
            </div>

            <div class="info-card">
              <h3 class="section-title">What's Next?</h3>
              <div class="list-item">✓ Please be ready 10 minutes before your scheduled pickup time</div>
              <div class="list-item">✓ Our professional driver will contact you prior to arrival</div>
              <div class="list-item">✓ Save this confirmation email for your records</div>
              <div class="list-item">✓ Contact us immediately if you need to make any changes</div>
            </div>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p class="footer-tagline">Your journey, our passion</p>
            <p style="margin-top: 12px; font-size: 11px; color: #adb5bd;">This is an automated confirmation email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function getTestEmailHTML(): Promise<string> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">SMTP Test Email</h1>
          </div>
          <div class="email-body">
            <div class="alert-box alert-success" style="text-align: center;">
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2b8a3e;">🎉 Congratulations!</p>
              <p style="margin: 8px 0 0 0; color: #2b8a3e;">Your SMTP configuration is working correctly.</p>
            </div>

            <p class="intro-text">This is a test email to verify that your email sending functionality is properly configured.</p>

            <div class="info-card">
              <h3 class="section-title">What This Means</h3>
              <div class="list-item">✓ Your SMTP settings are correct</div>
              <div class="list-item">✓ Email server connection is successful</div>
              <div class="list-item">✓ You can now send automated emails to your customers</div>
            </div>

            <div class="info-card">
              <h3 class="section-title">Ready to Send</h3>
              <div class="list-item">• Contact form notifications</div>
              <div class="list-item">• Booking confirmations</div>
              <div class="list-item">• Status update notifications</div>
              <div class="list-item">• Driver assignment alerts</div>
              <div class="list-item">• Payment confirmations</div>
            </div>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company} Email System</p>
            <p class="footer-tagline">Sent at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function getDriverOnTheWayEmailHTML(data: {
  passengerName: string;
  bookingId: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  pickupAddress: string;
  scheduledDateTime: string;
  estimatedArrival?: string;
}): Promise<string> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">Driver On The Way</h1>
          </div>
          <div class="email-body">
            <p class="greeting">Dear ${data.passengerName},</p>
            
            <div class="alert-box alert-info" style="text-align: center;">
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1971c2;">🚗 Your driver is on the way!</p>
              ${data.estimatedArrival ? `<p style="margin: 8px 0 0 0; color: #1971c2;">Estimated arrival: <strong>${data.estimatedArrival}</strong></p>` : '<p style="margin: 8px 0 0 0; color: #1971c2;">Please be ready for pickup.</p>'}
            </div>
            
            <div class="info-card">
              <h3 class="section-title">Driver Information</h3>
              <div class="info-row">
                <span class="info-label">Driver Name</span>
                <span class="info-value">${data.driverName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contact Number</span>
                <span class="info-value"><a href="tel:${data.driverPhone}">${data.driverPhone}</a></span>
              </div>
              <div class="info-row">
                <span class="info-label">Vehicle Type</span>
                <span class="info-value">${data.vehicleType}</span>
              </div>
            </div>

            <div class="info-card">
              <h3 class="section-title">Booking Details</h3>
              <div class="info-row">
                <span class="info-label">Booking ID</span>
                <span class="info-value">${data.bookingId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pickup Location</span>
                <span class="info-value">${data.pickupAddress}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Scheduled Time</span>
                <span class="info-value">${data.scheduledDateTime}</span>
              </div>
            </div>

            <div class="info-card">
              <h3 class="section-title">Please Note</h3>
              <div class="list-item">• Be ready and waiting at your pickup location</div>
              <div class="list-item">• Keep your phone nearby in case the driver needs to contact you</div>
              <div class="list-item">• Have your luggage ready for a smooth pickup</div>
            </div>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p class="footer-tagline">Your journey, our passion</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function getDriverArrivedEmailHTML(data: {
  passengerName: string;
  bookingId: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  pickupAddress: string;
}): Promise<string> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">Driver Has Arrived</h1>
          </div>
          <div class="email-body">
            <p class="greeting">Dear ${data.passengerName},</p>
            
            <div class="alert-box alert-success" style="text-align: center;">
              <p style="margin: 0; font-size: 20px; font-weight: 600; color: #2b8a3e;">📍 Your driver has arrived!</p>
              <p style="margin: 8px 0 0 0; color: #2b8a3e;">Please proceed to your vehicle.</p>
            </div>
            
            <div class="info-card">
              <h3 class="section-title">Driver Information</h3>
              <div class="info-row">
                <span class="info-label">Driver Name</span>
                <span class="info-value">${data.driverName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contact Number</span>
                <span class="info-value"><a href="tel:${data.driverPhone}">${data.driverPhone}</a></span>
              </div>
              <div class="info-row">
                <span class="info-label">Vehicle Type</span>
                <span class="info-value">${data.vehicleType}</span>
              </div>
            </div>

            <div class="info-card" style="background: #fff3cd; border-color: #f59f00;">
              <h3 class="section-title" style="border-color: #f59f00;">Pickup Location</h3>
              <p style="margin: 0; font-size: 15px; color: #333333;">📍 ${data.pickupAddress}</p>
            </div>

            <div class="info-card">
              <h3 class="section-title">What To Do Next</h3>
              <div class="list-item">• Proceed to the pickup location immediately</div>
              <div class="list-item">• Look for your ${data.vehicleType}</div>
              <div class="list-item">• Contact the driver if you have trouble locating the vehicle</div>
              <div class="list-item">• Have your belongings ready to load</div>
            </div>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p class="footer-tagline">Enjoy your ride!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function getBookingCancelledEmailHTML(data: {
  passengerName: string;
  bookingId: string;
  pickupAddress: string;
  destinationAddress?: string;
  scheduledDateTime: string;
  cancelReason?: string;
}): Promise<string> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">Booking Cancelled</h1>
          </div>
          <div class="email-body">
            <p class="greeting">Dear ${data.passengerName},</p>
            
            <div class="alert-box alert-danger">
              <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #c92a2a;">Your booking has been cancelled</p>
              <p style="margin: 0; color: #c92a2a;">Booking ID: <strong>${data.bookingId}</strong></p>
              ${data.cancelReason ? `
              <div style="margin-top: 16px; padding: 12px; background: #ffffff; border-radius: 6px;">
                <p style="margin: 0; font-size: 13px; color: #495057;"><strong>Cancellation Reason:</strong></p>
                <p style="margin: 8px 0 0 0; color: #333333;">${data.cancelReason}</p>
              </div>
              ` : ''}
            </div>
            
            <div class="info-card">
              <h3 class="section-title">Cancelled Booking Details</h3>
              <div class="info-row">
                <span class="info-label">Booking ID</span>
                <span class="info-value">${data.bookingId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pickup Location</span>
                <span class="info-value">${data.pickupAddress}</span>
              </div>
              ${data.destinationAddress ? `
              <div class="info-row">
                <span class="info-label">Destination</span>
                <span class="info-value">${data.destinationAddress}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Scheduled Date & Time</span>
                <span class="info-value">${data.scheduledDateTime}</span>
              </div>
            </div>

            <p class="intro-text">If you need to make a new booking, please visit our website or contact us directly.</p>
            <p style="color: #495057;">If you believe this cancellation was made in error, please contact our support team immediately.</p>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p class="footer-tagline">We hope to serve you again in the future</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  username: string
): Promise<boolean> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">Password Reset Request</h1>
          </div>
          <div class="email-body">
            <p class="greeting">Hello ${username},</p>
            <p class="intro-text">We received a request to reset your password for your ${company} account.</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" class="btn" style="color: #ffffff;">Reset Password</a>
            </div>
            
            <div class="info-card">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #495057;"><strong>Or copy and paste this link:</strong></p>
              <p style="margin: 0; word-break: break-all; font-size: 12px; color: #6c757d; background: #ffffff; padding: 12px; border-radius: 4px; border: 1px solid #e9ecef;">
                ${resetUrl}
              </p>
            </div>
            
            <div class="alert-box alert-warning">
              <p style="margin: 0; color: #856404;"><strong>This link will expire in 1 hour.</strong></p>
              <p style="margin: 8px 0 0 0; color: #856404; font-size: 14px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p style="color: #adb5bd; font-size: 11px;">© ${new Date().getFullYear()} ${company}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Password Reset Request - ${company}`,
    html,
  });
}

export async function sendTemporaryPasswordEmail(
  email: string,
  tempPassword: string,
  username: string
): Promise<boolean> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  const loginUrl = `${getAppBaseUrl()}/login`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">Temporary Password</h1>
          </div>
          <div class="email-body">
            <p class="greeting">Hello ${username},</p>
            <p class="intro-text">An administrator has set a temporary password for your ${company} account.</p>
            
            <div class="amount-box" style="background: #ffe3e3; border-color: #ffa8a8;">
              <div class="amount-label" style="color: #c92a2a;">Your Temporary Password</div>
              <div class="amount" style="color: #c92a2a; font-family: monospace; letter-spacing: 2px;">${tempPassword}</div>
            </div>
            
            <div class="alert-box alert-warning">
              <p style="margin: 0; font-weight: 600; color: #856404;">⚠️ Please change this password immediately after logging in.</p>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${loginUrl}" class="btn" style="color: #ffffff;">Log In Now</a>
            </div>
            
            <p style="color: #495057; font-size: 14px;">For security reasons, we recommend changing your password as soon as possible.</p>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p style="color: #adb5bd; font-size: 11px;">© ${new Date().getFullYear()} ${company}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Temporary Password Set - ${company}`,
    html,
  });
}

export async function sendUsernameReminderEmail(
  email: string,
  username: string
): Promise<boolean> {
  const branding = await getBrandingInfo();
  const company = branding.companyName;
  const logoUrl = branding.logoUrl;
  const loginUrl = `${getAppBaseUrl()}/login`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${getLogoHeader(logoUrl, company)}
            <h1 class="email-title">Username Reminder</h1>
          </div>
          <div class="email-body">
            <p class="greeting">Hello,</p>
            <p class="intro-text">We received a request for your username at ${company}.</p>
            
            <div class="amount-box">
              <div class="amount-label">Your Username</div>
              <div class="amount" style="font-size: 24px;">${username}</div>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${loginUrl}" class="btn" style="color: #ffffff;">Log In Now</a>
            </div>
            
            <p style="color: #495057; font-size: 14px;">If you did not request this information, please contact our support team.</p>
          </div>
          <div class="email-footer">
            <p class="footer-company">${company}</p>
            <p style="color: #adb5bd; font-size: 11px;">© ${new Date().getFullYear()} ${company}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Username Reminder - ${company}`,
    html,
  });
}

export function clearEmailCache() {
  cachedTransporter = null;
  lastSettingsCheck = 0;
}
