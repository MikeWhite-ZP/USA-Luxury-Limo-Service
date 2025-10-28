import { sendEmail } from './email';
import { storage } from './storage';
import type { Booking, User } from '@shared/schema';

async function getSystemAdminEmail(): Promise<string | null> {
  try {
    const setting = await storage.getSystemSetting('SYSTEM_ADMIN_EMAIL');
    return setting?.value || null;
  } catch (error) {
    console.error('Error fetching system admin email:', error);
    return null;
  }
}

export async function sendNewBookingReport(booking: Booking, passenger: User, vehicleTypeName: string) {
  try {
    const adminEmail = await getSystemAdminEmail();
    
    if (!adminEmail) {
      console.log('[EMAIL REPORT] System admin email not configured - skipping new booking report');
      return;
    }

    const scheduledDate = new Date(booking.scheduledDateTime).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const html = `
      <!DOCTYPE html>
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
            .route-section { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .amount-badge { background: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📋 New Booking Created</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">System Admin Report</p>
            </div>
            <div class="content">
              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Booking Details</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Booking ID</div>
                    <div class="info-value">${booking.id}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value" style="color: #2563eb;">⏳ ${booking.status?.toUpperCase() || 'PENDING'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Scheduled Date & Time</div>
                    <div class="info-value">${scheduledDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Service Type</div>
                    <div class="info-value">${booking.bookingType === 'transfer' ? '🚗 Transfer' : '⏱️ Hourly'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Vehicle Type</div>
                    <div class="info-value">${vehicleTypeName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Passengers</div>
                    <div class="info-value">${booking.passengerCount || 1}</div>
                  </div>
                </div>

                ${booking.requestedHours ? `
                <div class="info-item" style="margin-top: 10px;">
                  <div class="info-label">Duration</div>
                  <div class="info-value">${booking.requestedHours} hours</div>
                </div>
                ` : ''}
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Passenger Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Name</div>
                    <div class="info-value">${passenger.firstName} ${passenger.lastName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value"><a href="mailto:${passenger.email}">${passenger.email}</a></div>
                  </div>
                  ${passenger.phone ? `
                  <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value"><a href="tel:${passenger.phone}">${passenger.phone}</a></div>
                  </div>
                  ` : ''}
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Route Details</h3>
                <div class="route-section">
                  <div style="margin-bottom: 15px;">
                    <div class="info-label">📍 Pickup Location</div>
                    <div class="info-value">${booking.pickupAddress}</div>
                  </div>
                  ${booking.destinationAddress ? `
                  <div>
                    <div class="info-label">🎯 Destination</div>
                    <div class="info-value">${booking.destinationAddress}</div>
                  </div>
                  ` : ''}
                </div>
                ${booking.estimatedDistance ? `
                <div class="info-item">
                  <div class="info-label">Estimated Distance</div>
                  <div class="info-value">${Number(booking.estimatedDistance).toFixed(2)} miles</div>
                </div>
                ` : ''}
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Pricing Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Base Fare</div>
                    <div class="info-value">$${booking.baseFare || '0.00'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Payment Status</div>
                    <div class="info-value">${booking.paymentStatus === 'paid' ? '✅ Paid' : booking.paymentStatus === 'failed' ? '❌ Failed' : booking.paymentStatus === 'refunded' ? '💰 Refunded' : '⏳ Pending'}</div>
                  </div>
                </div>
                <div class="amount-badge">
                  💰 Total Amount: $${booking.totalAmount}
                </div>
              </div>

              ${booking.specialInstructions ? `
              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Special Instructions</h3>
                <div style="background: #fef3c7; padding: 15px; border-radius: 4px;">
                  ${booking.specialInstructions}
                </div>
              </div>
              ` : ''}

              ${booking.flightNumber ? `
              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Flight Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Flight Number</div>
                    <div class="info-value">✈️ ${booking.flightNumber}</div>
                  </div>
                  ${booking.flightArrival ? `
                  <div class="info-item">
                    <div class="info-label">Arrival Time</div>
                    <div class="info-value">${booking.flightArrival}</div>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p><strong>USA Luxury Limo - Admin Dashboard</strong></p>
              <p>Report generated at: ${new Date().toLocaleString()}</p>
              <p style="margin-top: 10px;">This is an automated system report for new booking notifications.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `🆕 New Booking #${booking.id.slice(0, 8)} - ${passenger.firstName} ${passenger.lastName}`,
      html
    });

    console.log(`[EMAIL REPORT] New booking report sent to ${adminEmail}`);
  } catch (error) {
    console.error('[EMAIL REPORT] Error sending new booking report:', error);
  }
}

export async function sendCancelledBookingReport(
  booking: Booking, 
  passenger: User, 
  vehicleTypeName: string, 
  cancelledBy: 'passenger' | 'driver' | 'system',
  reason?: string
) {
  try {
    const adminEmail = await getSystemAdminEmail();
    
    if (!adminEmail) {
      console.log('[EMAIL REPORT] System admin email not configured - skipping cancellation report');
      return;
    }

    const scheduledDate = new Date(booking.scheduledDateTime).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const cancelReason = reason || 'No reason provided';
    const cancelledByText = cancelledBy === 'system' ? 'Automatic System' : 
                           cancelledBy === 'driver' ? 'Driver' : 'Passenger';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .report-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .alert-box { background: #fee2e2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
            .info-item { padding: 12px; background: #f8fafc; border-radius: 4px; }
            .info-label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
            .info-value { color: #1e293b; font-size: 16px; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">❌ Booking Cancelled</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">System Admin Report</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <h3 style="margin-top: 0; color: #dc2626;">Cancellation Details</h3>
                <div class="info-grid">
                  <div class="info-item" style="background: #fef2f2;">
                    <div class="info-label">Cancelled By</div>
                    <div class="info-value" style="color: #dc2626; font-weight: bold;">${cancelledByText}</div>
                  </div>
                  <div class="info-item" style="background: #fef2f2;">
                    <div class="info-label">Cancelled At</div>
                    <div class="info-value">${new Date().toLocaleString()}</div>
                  </div>
                </div>
                <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 4px;">
                  <div class="info-label">Reason</div>
                  <div class="info-value">${cancelReason}</div>
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Booking Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Booking ID</div>
                    <div class="info-value">${booking.id}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Scheduled Date & Time</div>
                    <div class="info-value">${scheduledDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Service Type</div>
                    <div class="info-value">${booking.bookingType === 'transfer' ? '🚗 Transfer' : '⏱️ Hourly'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Vehicle Type</div>
                    <div class="info-value">${vehicleTypeName}</div>
                  </div>
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Passenger Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Name</div>
                    <div class="info-value">${passenger.firstName} ${passenger.lastName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value"><a href="mailto:${passenger.email}">${passenger.email}</a></div>
                  </div>
                  ${passenger.phone ? `
                  <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value"><a href="tel:${passenger.phone}">${passenger.phone}</a></div>
                  </div>
                  ` : ''}
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Route Details</h3>
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
                  <div style="margin-bottom: 15px;">
                    <div class="info-label">📍 Pickup Location</div>
                    <div class="info-value">${booking.pickupAddress}</div>
                  </div>
                  ${booking.destinationAddress ? `
                  <div>
                    <div class="info-label">🎯 Destination</div>
                    <div class="info-value">${booking.destinationAddress}</div>
                  </div>
                  ` : ''}
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Financial Impact</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Total Amount</div>
                    <div class="info-value">$${booking.totalAmount}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Payment Status</div>
                    <div class="info-value">${booking.paymentStatus === 'paid' ? '✅ Paid' : booking.paymentStatus === 'failed' ? '❌ Failed' : booking.paymentStatus === 'refunded' ? '💰 Refunded' : '⏳ Pending'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="footer">
              <p><strong>USA Luxury Limo - Admin Dashboard</strong></p>
              <p>Report generated at: ${new Date().toLocaleString()}</p>
              <p style="margin-top: 10px;">This is an automated system report for booking cancellations.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `❌ Booking Cancelled #${booking.id.slice(0, 8)} - ${cancelledByText}`,
      html
    });

    console.log(`[EMAIL REPORT] Cancellation report sent to ${adminEmail}`);
  } catch (error) {
    console.error('[EMAIL REPORT] Error sending cancellation report:', error);
  }
}

export async function sendDriverActivityReport(
  activity: {
    type: 'acceptance' | 'decline' | 'on_the_way' | 'arrived' | 'on_board' | 'completed';
    booking: Booking;
    driver: User;
    passenger: User;
    vehicleTypeName: string;
    timestamp: Date;
    details?: string;
  }
) {
  try {
    const adminEmail = await getSystemAdminEmail();
    
    if (!adminEmail) {
      console.log('[EMAIL REPORT] System admin email not configured - skipping driver activity report');
      return;
    }

    const activityLabels = {
      acceptance: { icon: '✅', text: 'Job Accepted', color: '#16a34a' },
      decline: { icon: '❌', text: 'Job Declined', color: '#dc2626' },
      on_the_way: { icon: '🚗', text: 'On The Way', color: '#2563eb' },
      arrived: { icon: '📍', text: 'Arrived at Pickup', color: '#7c3aed' },
      on_board: { icon: '👥', text: 'Passenger On Board', color: '#ea580c' },
      completed: { icon: '🏁', text: 'Trip Completed', color: '#059669' },
    };

    const activityInfo = activityLabels[activity.type];
    const scheduledDate = new Date(activity.booking.scheduledDateTime).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${activityInfo.color} 0%, ${activityInfo.color}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .report-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${activityInfo.color}; }
            .activity-badge { background: ${activityInfo.color}20; border: 2px solid ${activityInfo.color}; color: ${activityInfo.color}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 20px; font-weight: bold; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
            .info-item { padding: 12px; background: #f8fafc; border-radius: 4px; }
            .info-label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
            .info-value { color: #1e293b; font-size: 16px; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${activityInfo.icon} Driver Activity</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">System Admin Report</p>
            </div>
            <div class="content">
              <div class="activity-badge">
                ${activityInfo.icon} ${activityInfo.text}
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Activity Details</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Activity Type</div>
                    <div class="info-value" style="color: ${activityInfo.color};">${activityInfo.text}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Timestamp</div>
                    <div class="info-value">${activity.timestamp.toLocaleString()}</div>
                  </div>
                </div>
                ${activity.details ? `
                <div style="margin-top: 15px; padding: 15px; background: #fef3c7; border-radius: 4px;">
                  <div class="info-label">Additional Details</div>
                  <div class="info-value">${activity.details}</div>
                </div>
                ` : ''}
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Driver Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Driver Name</div>
                    <div class="info-value">${activity.driver.firstName} ${activity.driver.lastName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Driver Email</div>
                    <div class="info-value"><a href="mailto:${activity.driver.email}">${activity.driver.email}</a></div>
                  </div>
                  ${activity.driver.phone ? `
                  <div class="info-item">
                    <div class="info-label">Driver Phone</div>
                    <div class="info-value"><a href="tel:${activity.driver.phone}">${activity.driver.phone}</a></div>
                  </div>
                  ` : ''}
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Booking Details</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Booking ID</div>
                    <div class="info-value">${activity.booking.id}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Scheduled Date & Time</div>
                    <div class="info-value">${scheduledDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Vehicle Type</div>
                    <div class="info-value">${activity.vehicleTypeName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Service Type</div>
                    <div class="info-value">${activity.booking.bookingType === 'transfer' ? '🚗 Transfer' : '⏱️ Hourly'}</div>
                  </div>
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Passenger Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Name</div>
                    <div class="info-value">${activity.passenger.firstName} ${activity.passenger.lastName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value"><a href="mailto:${activity.passenger.email}">${activity.passenger.email}</a></div>
                  </div>
                  ${activity.passenger.phone ? `
                  <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value"><a href="tel:${activity.passenger.phone}">${activity.passenger.phone}</a></div>
                  </div>
                  ` : ''}
                </div>
              </div>

              <div class="report-section">
                <h3 style="margin-top: 0; color: #1e293b;">Route Details</h3>
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
                  <div style="margin-bottom: 15px;">
                    <div class="info-label">📍 Pickup Location</div>
                    <div class="info-value">${activity.booking.pickupAddress}</div>
                  </div>
                  ${activity.booking.destinationAddress ? `
                  <div>
                    <div class="info-label">🎯 Destination</div>
                    <div class="info-value">${activity.booking.destinationAddress}</div>
                  </div>
                  ` : ''}
                </div>
              </div>
            </div>
            <div class="footer">
              <p><strong>USA Luxury Limo - Admin Dashboard</strong></p>
              <p>Report generated at: ${new Date().toLocaleString()}</p>
              <p style="margin-top: 10px;">This is an automated system report for driver activity tracking.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `${activityInfo.icon} Driver Activity: ${activityInfo.text} - Booking #${activity.booking.id.slice(0, 8)}`,
      html
    });

    console.log(`[EMAIL REPORT] Driver activity report sent to ${adminEmail}`);
  } catch (error) {
    console.error('[EMAIL REPORT] Error sending driver activity report:', error);
  }
}
