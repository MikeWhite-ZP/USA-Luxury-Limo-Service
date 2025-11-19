import { sendEmail } from './email';
import type { EmailTemplateSlug } from '@shared/schema';

// Default email template configurations
export interface DefaultEmailTemplate {
  slug: EmailTemplateSlug;
  name: string;
  subject: string;
  body: string;
  variables: Array<{
    name: string;
    description: string;
    example: string;
  }>;
  category: 'customer' | 'driver' | 'admin' | 'test';
  description: string;
}

// Variable replacement utility
export function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value !== null && value !== undefined ? String(value) : '');
  }
  
  return result;
}

// Default templates collection
const defaultTemplates: Record<EmailTemplateSlug, DefaultEmailTemplate> = {
  contact_form: {
    slug: 'contact_form',
    name: 'Contact Form Submission',
    subject: 'New Contact Form Submission',
    category: 'customer',
    description: 'Sent to admin when a customer submits a contact form',
    variables: [
      { name: 'first_name', description: 'Customer first name', example: 'John' },
      { name: 'last_name', description: 'Customer last name', example: 'Doe' },
      { name: 'email', description: 'Customer email', example: 'john@example.com' },
      { name: 'phone', description: 'Customer phone', example: '+1 234 567 8900' },
      { name: 'service_type', description: 'Requested service type', example: 'Airport Transfer' },
      { name: 'message', description: 'Customer message', example: 'I need a quote...' },
      { name: 'submitted_at', description: 'Submission timestamp', example: 'January 1, 2025 at 10:00 AM' },
      { name: 'email_logo_html', description: 'Company logo image HTML (if enabled) or empty string', example: '<img src="..." alt="Company Logo" style="max-width: 200px;" />' },
      { name: 'company_name', description: 'Company name text (if logo not enabled)', example: 'USA Luxury Limo' },
    ],
    body: `<!DOCTYPE html>
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
        {{email_logo_html}}<p style="margin: 10px 0 0 0;">{{company_name}}</p>
      </div>
      <div class="content">
        <div class="field">
          <div class="field-label">From:</div>
          <div class="field-value">{{first_name}} {{last_name}}</div>
        </div>
        <div class="field">
          <div class="field-label">Email:</div>
          <div class="field-value"><a href="mailto:{{email}}">{{email}}</a></div>
        </div>
        <div class="field">
          <div class="field-label">Phone:</div>
          <div class="field-value"><a href="tel:{{phone}}">{{phone}}</a></div>
        </div>
        <div class="field">
          <div class="field-label">Service Type:</div>
          <div class="field-value">{{service_type}}</div>
        </div>
        <div class="field">
          <div class="field-label">Message:</div>
          <div class="field-value" style="white-space: pre-wrap;">{{message}}</div>
        </div>
        <div class="field">
          <div class="field-label">Submitted At:</div>
          <div class="field-value">{{submitted_at}}</div>
        </div>
      </div>
      <div class="footer">
        <p>This email was sent from the USA Luxury Limo contact form.</p>
        <p>Please respond to the customer at <a href="mailto:{{email}}">{{email}}</a></p>
      </div>
    </div>
  </body>
</html>`
  },

  booking_confirmation: {
    slug: 'booking_confirmation',
    name: 'Booking Confirmation',
    subject: 'Booking Confirmation - {{booking_id}}',
    category: 'customer',
    description: 'Sent to customer when a booking is confirmed',
    variables: [
      { name: 'passenger_name', description: 'Passenger name', example: 'John Doe' },
      { name: 'booking_id', description: 'Booking ID', example: 'BK-12345' },
      { name: 'pickup_address', description: 'Pickup address', example: '123 Main St, City' },
      { name: 'destination_address', description: 'Destination address', example: '456 Oak Ave, City' },
      { name: 'scheduled_datetime', description: 'Scheduled date and time', example: 'January 1, 2025 at 10:00 AM' },
      { name: 'vehicle_type', description: 'Vehicle type', example: 'Luxury Sedan' },
      { name: 'total_amount', description: 'Total amount', example: '150.00' },
      { name: 'status', description: 'Booking status', example: 'confirmed' },
    ],
    body: `<!DOCTYPE html>
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
        <p>Dear {{passenger_name}},</p>
        <p>Thank you for choosing USA Luxury Limo! Your booking has been confirmed.</p>
        
        <div class="booking-details">
          <div class="detail-row">
            <span class="detail-label">Booking ID:</span>
            <span class="detail-value">{{booking_id}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Pickup Location:</span>
            <span class="detail-value">{{pickup_address}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Destination:</span>
            <span class="detail-value">{{destination_address}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Scheduled Date & Time:</span>
            <span class="detail-value">{{scheduled_datetime}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Vehicle Type:</span>
            <span class="detail-value">{{vehicle_type}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">{{status}}</span>
          </div>
        </div>

        <div class="total-amount">
          Total Amount: \${{total_amount}}
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
      </div>
    </div>
  </body>
</html>`
  },

  booking_status_update: {
    slug: 'booking_status_update',
    name: 'Booking Status Update',
    subject: 'Booking Status Update - {{booking_id}}',
    category: 'customer',
    description: 'Sent to customer when booking status changes',
    variables: [
      { name: 'passenger_name', description: 'Passenger name', example: 'John Doe' },
      { name: 'booking_id', description: 'Booking ID', example: 'BK-12345' },
      { name: 'old_status', description: 'Previous status', example: 'pending' },
      { name: 'new_status', description: 'New status', example: 'confirmed' },
      { name: 'pickup_address', description: 'Pickup address', example: '123 Main St' },
      { name: 'scheduled_datetime', description: 'Scheduled date/time', example: 'Jan 1, 2025 10:00 AM' },
    ],
    body: `<!DOCTYPE html>
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
        <p>Dear {{passenger_name}},</p>
        <p>Your booking status has been updated.</p>
        
        <div class="status-update">
          <h3>Booking ID: {{booking_id}}</h3>
          <p>
            <span class="status-badge" style="background: #ffebee; color: #c62828;">{{old_status}}</span>
            <span style="font-size: 24px;">→</span>
            <span class="status-badge" style="background: #e8f5e9; color: #2e7d32;">{{new_status}}</span>
          </p>
          <p style="margin-top: 20px;"><strong>Pickup:</strong> {{pickup_address}}</p>
          <p><strong>Scheduled:</strong> {{scheduled_datetime}}</p>
        </div>
      </div>
      <div class="footer">
        <p><strong>USA Luxury Limo</strong></p>
        <p>For questions or support, please contact us through our website.</p>
      </div>
    </div>
  </body>
</html>`
  },

  driver_assignment: {
    slug: 'driver_assignment',
    name: 'Driver Assignment Notification',
    subject: 'New Ride Assignment - {{booking_id}}',
    category: 'driver',
    description: 'Sent to driver when assigned to a booking',
    variables: [
      { name: 'driver_name', description: 'Driver name', example: 'Mike Smith' },
      { name: 'booking_id', description: 'Booking ID', example: 'BK-12345' },
      { name: 'passenger_name', description: 'Passenger name', example: 'John Doe' },
      { name: 'passenger_phone', description: 'Passenger phone', example: '+1 234 567 8900' },
      { name: 'pickup_address', description: 'Pickup address', example: '123 Main St' },
      { name: 'destination_address', description: 'Destination address', example: '456 Oak Ave' },
      { name: 'scheduled_datetime', description: 'Scheduled date/time', example: 'Jan 1, 2025 10:00 AM' },
      { name: 'vehicle_type', description: 'Vehicle type', example: 'Luxury Sedan' },
      { name: 'driver_payment', description: 'Driver payment amount (optional)', example: '75.00' },
    ],
    body: `<!DOCTYPE html>
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
        <p>Dear {{driver_name}},</p>
        <p>You have been assigned a new ride. Please review the details below:</p>
        
        <div class="ride-details">
          <div class="detail-row">
            <span class="detail-label">Booking ID:</span>
            <span class="detail-value">{{booking_id}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Passenger Name:</span>
            <span class="detail-value">{{passenger_name}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Passenger Phone:</span>
            <span class="detail-value"><a href="tel:{{passenger_phone}}">{{passenger_phone}}</a></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Pickup Location:</span>
            <span class="detail-value">{{pickup_address}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Destination:</span>
            <span class="detail-value">{{destination_address}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Scheduled Date & Time:</span>
            <span class="detail-value">{{scheduled_datetime}}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Vehicle Type:</span>
            <span class="detail-value">{{vehicle_type}}</span>
          </div>
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
</html>`
  },

  password_reset: {
    slug: 'password_reset',
    name: 'Password Reset Request',
    subject: 'Password Reset Request',
    category: 'customer',
    description: 'Sent to user when they request a password reset',
    variables: [
      { name: 'name', description: 'User name', example: 'John Doe' },
      { name: 'reset_link', description: 'Password reset link', example: 'https://example.com/reset?token=abc123' },
      { name: 'expires_in', description: 'Link expiration time', example: '1 hour' },
    ],
    body: `<!DOCTYPE html>
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
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center;">
          <a href="{{reset_link}}" class="button">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: #fff; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
          {{reset_link}}
        </p>
        
        <div class="warning">
          <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
          <ul style="margin: 10px 0 0 0;">
            <li>This link will expire in {{expires_in}}</li>
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
</html>`
  },

  payment_confirmation: {
    slug: 'payment_confirmation',
    name: 'Payment Confirmation',
    subject: 'Payment Confirmation - {{invoice_number}}',
    category: 'customer',
    description: 'Sent to customer after successful payment',
    variables: [
      { name: 'passenger_name', description: 'Passenger name', example: 'John Doe' },
      { name: 'invoice_number', description: 'Invoice number', example: 'INV-12345' },
      { name: 'booking_id', description: 'Booking ID', example: 'BK-12345' },
      { name: 'amount', description: 'Payment amount', example: '150.00' },
      { name: 'payment_date', description: 'Payment date', example: 'January 1, 2025' },
      { name: 'pickup_address', description: 'Pickup address', example: '123 Main St' },
      { name: 'scheduled_datetime', description: 'Scheduled date/time', example: 'Jan 1, 2025 10:00 AM' },
    ],
    body: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .success-banner { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left: 5px solid #10b981; padding: 25px 30px; text-align: center; }
      .amount { font-size: 32px; font-weight: bold; color: #10b981; margin: 10px 0; }
      .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">✅ Payment Confirmed</h1>
        <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
      </div>
      <div class="content">
        <div class="success-banner">
          <h2 style="margin: 0; color: #065f46;">Payment Successful!</h2>
          <div class="amount">\${{amount}}</div>
          <p style="margin: 5px 0 0 0; color: #047857;">Invoice #{{invoice_number}}</p>
        </div>
        
        <p>Dear {{passenger_name}},</p>
        <p>Thank you for your payment! Your transaction has been successfully processed.</p>
        
        <p><strong>Payment Details:</strong></p>
        <ul>
          <li>Invoice Number: {{invoice_number}}</li>
          <li>Booking ID: {{booking_id}}</li>
          <li>Amount Paid: \${{amount}}</li>
          <li>Payment Date: {{payment_date}}</li>
        </ul>
        
        <p><strong>Booking Information:</strong></p>
        <ul>
          <li>Pickup: {{pickup_address}}</li>
          <li>Scheduled: {{scheduled_datetime}}</li>
        </ul>
      </div>
      <div class="footer">
        <p><strong>USA Luxury Limo</strong></p>
        <p>Your journey, our passion.</p>
      </div>
    </div>
  </body>
</html>`
  },

  driver_on_way: {
    slug: 'driver_on_way',
    name: 'Driver On The Way',
    subject: 'Your Driver is On The Way - {{booking_id}}',
    category: 'customer',
    description: 'Sent to customer when driver is en route',
    variables: [
      { name: 'passenger_name', description: 'Passenger name', example: 'John Doe' },
      { name: 'booking_id', description: 'Booking ID', example: 'BK-12345' },
      { name: 'driver_name', description: 'Driver name', example: 'Mike Smith' },
      { name: 'vehicle_info', description: 'Vehicle information', example: 'Black Mercedes S-Class, ABC 123' },
      { name: 'eta', description: 'Estimated time of arrival', example: '15 minutes' },
      { name: 'pickup_address', description: 'Pickup address', example: '123 Main St' },
    ],
    body: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .eta-box { background: white; border: 3px solid #2563eb; padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; }
      .eta-time { font-size: 36px; font-weight: bold; color: #2563eb; margin: 10px 0; }
      .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">🚗 Your Driver is On The Way!</h1>
        <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
      </div>
      <div class="content">
        <p>Dear {{passenger_name}},</p>
        <p>Your driver is now en route to your pickup location.</p>
        
        <div class="eta-box">
          <p style="margin: 0; color: #64748b; font-size: 14px;">ESTIMATED ARRIVAL</p>
          <div class="eta-time">{{eta}}</div>
        </div>
        
        <p><strong>Driver Information:</strong></p>
        <ul>
          <li>Driver: {{driver_name}}</li>
          <li>Vehicle: {{vehicle_info}}</li>
          <li>Booking ID: {{booking_id}}</li>
          <li>Pickup Location: {{pickup_address}}</li>
        </ul>
        
        <p><strong>Please be ready!</strong> Your driver will arrive shortly.</p>
      </div>
      <div class="footer">
        <p><strong>USA Luxury Limo</strong></p>
      </div>
    </div>
  </body>
</html>`
  },

  driver_arrived: {
    slug: 'driver_arrived',
    name: 'Driver Arrived',
    subject: 'Your Driver Has Arrived - {{booking_id}}',
    category: 'customer',
    description: 'Sent to customer when driver arrives at pickup location',
    variables: [
      { name: 'passenger_name', description: 'Passenger name', example: 'John Doe' },
      { name: 'booking_id', description: 'Booking ID', example: 'BK-12345' },
      { name: 'driver_name', description: 'Driver name', example: 'Mike Smith' },
      { name: 'vehicle_info', description: 'Vehicle information', example: 'Black Mercedes S-Class, ABC 123' },
      { name: 'pickup_address', description: 'Pickup address', example: '123 Main St' },
    ],
    body: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .arrived-box { background: #d1fae5; border: 3px solid #10b981; padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; }
      .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">📍 Your Driver Has Arrived!</h1>
        <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
      </div>
      <div class="content">
        <p>Dear {{passenger_name}},</p>
        
        <div class="arrived-box">
          <h2 style="margin: 0; color: #065f46; font-size: 28px;">✓ Driver is Waiting</h2>
          <p style="margin: 10px 0 0 0; color: #047857; font-size: 18px;">Please proceed to your vehicle</p>
        </div>
        
        <p><strong>Driver & Vehicle Information:</strong></p>
        <ul>
          <li>Driver: {{driver_name}}</li>
          <li>Vehicle: {{vehicle_info}}</li>
          <li>Booking ID: {{booking_id}}</li>
          <li>Location: {{pickup_address}}</li>
        </ul>
      </div>
      <div class="footer">
        <p><strong>USA Luxury Limo</strong></p>
      </div>
    </div>
  </body>
</html>`
  },

  booking_cancelled: {
    slug: 'booking_cancelled',
    name: 'Booking Cancelled',
    subject: 'Booking Cancelled - {{booking_id}}',
    category: 'customer',
    description: 'Sent to customer when a booking is cancelled',
    variables: [
      { name: 'passenger_name', description: 'Passenger name', example: 'John Doe' },
      { name: 'booking_id', description: 'Booking ID', example: 'BK-12345' },
      { name: 'pickup_address', description: 'Pickup address', example: '123 Main St' },
      { name: 'scheduled_datetime', description: 'Scheduled date/time', example: 'Jan 1, 2025 10:00 AM' },
      { name: 'cancelled_by', description: 'Who cancelled', example: 'passenger' },
      { name: 'reason', description: 'Cancellation reason (optional)', example: 'Schedule change' },
    ],
    body: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .cancelled-box { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
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
        <p>Dear {{passenger_name}},</p>
        
        <div class="cancelled-box">
          <h3 style="margin-top: 0; color: #dc2626;">Your booking has been cancelled</h3>
          <p><strong>Booking ID:</strong> {{booking_id}}</p>
          <p><strong>Pickup:</strong> {{pickup_address}}</p>
          <p><strong>Was scheduled for:</strong> {{scheduled_datetime}}</p>
        </div>
        
        <p>If you need to make a new booking or have any questions, please contact us.</p>
      </div>
      <div class="footer">
        <p><strong>USA Luxury Limo</strong></p>
      </div>
    </div>
  </body>
</html>`
  },

  temporary_password: {
    slug: 'temporary_password',
    name: 'Temporary Password',
    subject: 'Temporary Password Set',
    category: 'admin',
    description: 'Sent when admin sets a temporary password for a user',
    variables: [
      { name: 'username', description: 'Username', example: 'johndoe' },
      { name: 'temp_password', description: 'Temporary password', example: 'Temp@123' },
      { name: 'login_url', description: 'Login URL', example: 'https://example.com/login' },
    ],
    body: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .password-box { background: #fff; border: 2px solid #dc2626; padding: 15px; margin: 20px 0; text-align: center; font-size: 18px; font-family: monospace; }
      .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
      .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">🔑 Temporary Password</h1>
        <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
      </div>
      <div class="content">
        <p>Hello {{username}},</p>
        <p>An administrator has set a temporary password for your account.</p>
        <p>Your temporary password is:</p>
        <div class="password-box">{{temp_password}}</div>
        <p><strong>Please change this password immediately after logging in.</strong></p>
        <p style="text-align: center;">
          <a href="{{login_url}}" class="button">Log In Now</a>
        </p>
      </div>
      <div class="footer">
        <p><strong>USA Luxury Limo</strong></p>
      </div>
    </div>
  </body>
</html>`
  },

  username_reminder: {
    slug: 'username_reminder',
    name: 'Username Reminder',
    subject: 'Username Reminder',
    category: 'customer',
    description: 'Sent when user requests username reminder',
    variables: [
      { name: 'username', description: 'Username', example: 'johndoe' },
      { name: 'login_url', description: 'Login URL', example: 'https://example.com/login' },
    ],
    body: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .username-box { background: #fff; border: 2px solid #dc2626; padding: 15px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }
      .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
      .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">👤 Username Reminder</h1>
        <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>We received a request for your username.</p>
        <p>Your username is:</p>
        <div class="username-box">{{username}}</div>
        <p style="text-align: center;">
          <a href="{{login_url}}" class="button">Log In Now</a>
        </p>
      </div>
      <div class="footer">
        <p><strong>USA Luxury Limo</strong></p>
      </div>
    </div>
  </body>
</html>`
  },

  new_booking_report: {
    slug: 'new_booking_report',
    name: 'New Booking Report (Admin)',
    subject: 'New Booking Created - {{booking_id}}',
    category: 'admin',
    description: 'Admin report sent when a new booking is created',
    variables: [
      { name: 'booking_id', description: 'Booking ID', example: 'BK-12345' },
      { name: 'passenger_name', description: 'Passenger name', example: 'John Doe' },
      { name: 'passenger_email', description: 'Passenger email', example: 'john@example.com' },
      { name: 'passenger_phone', description: 'Passenger phone', example: '+1 234 567 8900' },
      { name: 'pickup_address', description: 'Pickup address', example: '123 Main St' },
      { name: 'destination_address', description: 'Destination address', example: '456 Oak Ave' },
      { name: 'scheduled_datetime', description: 'Scheduled date/time', example: 'Jan 1, 2025 10:00 AM' },
      { name: 'vehicle_type', description: 'Vehicle type', example: 'Luxury Sedan' },
      { name: 'total_amount', description: 'Total amount', example: '150.00' },
      { name: 'payment_method', description: 'Payment method', example: 'Credit Card' },
    ],
    body: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 700px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .report-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
      .info-item { padding: 12px; background: #f8fafc; border-radius: 4px; }
      .info-label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
      .info-value { color: #1e293b; font-size: 16px; }
      .amount-badge { background: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
      .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">📋 New Booking Created</h1>
        <p style="margin: 10px 0 0 0;">System Admin Report</p>
      </div>
      <div class="content">
        <div class="report-section">
          <h3 style="margin-top: 0; color: #1e293b;">Booking Details</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Booking ID</div>
              <div class="info-value">{{booking_id}}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Vehicle Type</div>
              <div class="info-value">{{vehicle_type}}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Passenger</div>
              <div class="info-value">{{passenger_name}}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Contact</div>
              <div class="info-value">{{passenger_phone}}</div>
            </div>
          </div>
          
          <h4 style="color: #64748b; margin: 20px 0 10px;">Route Information</h4>
          <div class="info-item" style="margin-bottom: 10px;">
            <div class="info-label">Pickup</div>
            <div class="info-value">{{pickup_address}}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Destination</div>
            <div class="info-value">{{destination_address}}</div>
          </div>
          <div class="info-item" style="margin-top: 10px;">
            <div class="info-label">Scheduled Time</div>
            <div class="info-value">{{scheduled_datetime}}</div>
          </div>
          
          <div class="amount-badge">
            Total: \${{total_amount}}
          </div>
        </div>
      </div>
      <div class="footer">
        <p><strong>USA Luxury Limo - Admin Dashboard</strong></p>
      </div>
    </div>
  </body>
</html>`
  },

  cancelled_booking_report: {
    slug: 'cancelled_booking_report',
    name: 'Cancelled Booking Report (Admin)',
    subject: 'Booking Cancelled - {{booking_id}}',
    category: 'admin',
    description: 'Admin report sent when a booking is cancelled',
    variables: [
      { name: 'booking_id', description: 'Booking ID', example: 'BK-12345' },
      { name: 'passenger_name', description: 'Passenger name', example: 'John Doe' },
      { name: 'cancelled_by', description: 'Who cancelled', example: 'passenger' },
      { name: 'reason', description: 'Cancellation reason', example: 'Schedule change' },
      { name: 'pickup_address', description: 'Pickup address', example: '123 Main St' },
      { name: 'scheduled_datetime', description: 'Scheduled date/time', example: 'Jan 1, 2025 10:00 AM' },
    ],
    body: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 700px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .report-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
      .alert-box { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">❌ Booking Cancelled</h1>
        <p style="margin: 10px 0 0 0;">System Admin Report</p>
      </div>
      <div class="content">
        <div class="alert-box">
          <h3 style="margin-top: 0; color: #dc2626;">Cancellation Details</h3>
          <p><strong>Booking ID:</strong> {{booking_id}}</p>
          <p><strong>Cancelled By:</strong> {{cancelled_by}}</p>
          <p><strong>Reason:</strong> {{reason}}</p>
        </div>
        
        <div class="report-section">
          <h4>Booking Information</h4>
          <p><strong>Passenger:</strong> {{passenger_name}}</p>
          <p><strong>Pickup:</strong> {{pickup_address}}</p>
          <p><strong>Was scheduled for:</strong> {{scheduled_datetime}}</p>
        </div>
      </div>
      <div class="footer">
        <p><strong>USA Luxury Limo - Admin Dashboard</strong></p>
      </div>
    </div>
  </body>
</html>`
  },

  driver_activity_report: {
    slug: 'driver_activity_report',
    name: 'Driver Activity Report (Admin)',
    subject: 'Driver Activity - {{activity_type}}',
    category: 'admin',
    description: 'Admin report for driver activity (acceptance, arrival, completion)',
    variables: [
      { name: 'activity_type', description: 'Activity type', example: 'acceptance' },
      { name: 'booking_id', description: 'Booking ID', example: 'BK-12345' },
      { name: 'driver_name', description: 'Driver name', example: 'Mike Smith' },
      { name: 'passenger_name', description: 'Passenger name', example: 'John Doe' },
      { name: 'pickup_address', description: 'Pickup address', example: '123 Main St' },
      { name: 'scheduled_datetime', description: 'Scheduled date/time', example: 'Jan 1, 2025 10:00 AM' },
      { name: 'timestamp', description: 'Activity timestamp', example: 'Jan 1, 2025 9:00 AM' },
    ],
    body: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 700px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .report-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed; }
      .activity-badge { background: #ede9fe; border: 2px solid #7c3aed; color: #6d28d9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 20px; font-weight: bold; }
      .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">🚗 Driver Activity Report</h1>
        <p style="margin: 10px 0 0 0;">System Admin Report</p>
      </div>
      <div class="content">
        <div class="activity-badge">
          {{activity_type}}
        </div>
        
        <div class="report-section">
          <h4>Activity Details</h4>
          <p><strong>Timestamp:</strong> {{timestamp}}</p>
          <p><strong>Booking ID:</strong> {{booking_id}}</p>
          <p><strong>Driver:</strong> {{driver_name}}</p>
          <p><strong>Passenger:</strong> {{passenger_name}}</p>
          <p><strong>Pickup:</strong> {{pickup_address}}</p>
          <p><strong>Scheduled:</strong> {{scheduled_datetime}}</p>
        </div>
      </div>
      <div class="footer">
        <p><strong>USA Luxury Limo - Admin Dashboard</strong></p>
      </div>
    </div>
  </body>
</html>`
  },

  test_email: {
    slug: 'test_email',
    name: 'Test Email',
    subject: 'Test Email from USA Luxury Limo',
    category: 'test',
    description: 'Test email for SMTP configuration verification',
    variables: [
      { name: 'test_time', description: 'Test timestamp', example: 'January 1, 2025 at 10:00 AM' },
    ],
    body: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .success-box { background: #d1fae5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
      .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">✉️ Test Email</h1>
        <p style="margin: 10px 0 0 0;">USA Luxury Limo</p>
      </div>
      <div class="content">
        <div class="success-box">
          <h2 style="margin: 0; color: #065f46;">✓ Email Configuration Working!</h2>
          <p style="margin: 10px 0 0 0; color: #047857;">Your SMTP settings are properly configured</p>
        </div>
        
        <p>This is a test email sent from the USA Luxury Limo admin panel to verify that your email configuration is working correctly.</p>
        
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Sent at: {{test_time}}</li>
          <li>Status: Successfully Delivered</li>
        </ul>
      </div>
      <div class="footer">
        <p><strong>USA Luxury Limo - Email System</strong></p>
      </div>
    </div>
  </body>
</html>`
  },
};

// Helper function to get a default template by slug
export async function getDefaultEmailTemplate(slug: EmailTemplateSlug): Promise<DefaultEmailTemplate | null> {
  return defaultTemplates[slug] || null;
}

// Helper function to get all default templates
export async function getAllDefaultEmailTemplates(): Promise<DefaultEmailTemplate[]> {
  return Object.values(defaultTemplates);
}

// Helper function to send a test email
export async function sendTestEmail(slug: EmailTemplateSlug, toEmail: string): Promise<boolean> {
  try {
    // Import storage and get template from database
    const { storage } = await import('./storage');
    const dbTemplate = await storage.getEmailTemplateBySlug(slug);
    
    if (!dbTemplate) {
      return false;
    }

    // Get default template for example data
    const defaultTemplate = defaultTemplates[slug];
    if (!defaultTemplate) {
      return false;
    }

    // Replace variables with example data
    const exampleData: Record<string, string> = {};
    defaultTemplate.variables.forEach(variable => {
      exampleData[variable.name] = variable.example;
    });
    
    // Add default test_time if not present
    if (slug === 'test_email' && !exampleData.test_time) {
      exampleData.test_time = new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
      });
    }

    // Add logo or company name based on template settings
    if (dbTemplate.logoActive && dbTemplate.logoMediaId) {
      try {
        // Fetch logo from media library
        const logoMedia = await storage.getCmsMediaById(dbTemplate.logoMediaId);
        if (logoMedia && logoMedia.fileUrl) {
          // Use the fileUrl directly - it will be accessible in emails
          // For emails, we can use data URIs or hosted URLs
          // For now, use the fileUrl as-is (assuming it's publicly accessible or a data URI)
          exampleData.email_logo_html = `<img src="${logoMedia.fileUrl}" alt="Company Logo" style="max-width: 200px; height: auto;" />`;
          exampleData.company_name = ''; // Empty when logo is shown
        } else {
          // Fallback to company name
          exampleData.email_logo_html = '';
          exampleData.company_name = 'USA Luxury Limo';
        }
      } catch (error) {
        console.error('Error fetching logo for email:', error);
        // Fallback to company name on error
        exampleData.email_logo_html = '';
        exampleData.company_name = 'USA Luxury Limo';
      }
    } else {
      // Logo not active, use company name
      exampleData.email_logo_html = '';
      exampleData.company_name = 'USA Luxury Limo';
    }

    // Use the database template body and subject
    const body = replaceVariables(dbTemplate.body, exampleData);
    const subject = replaceVariables(dbTemplate.subject, exampleData);

    return await sendEmail({
      to: toEmail,
      subject: `[TEST] ${subject}`,
      html: body,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
}
