import { storage } from './storage';
import { sendEmail } from './email';
import { sendSMS } from './sms';

const MONITOR_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let monitorInterval: NodeJS.Timeout | null = null;

/**
 * Start the booking monitor background worker
 * This runs every 5 minutes to check for:
 * 1. Bookings needing first reminder (2 hours before)
 * 2. Bookings needing second reminder (1 hour before)
 * 3. Overdue bookings for auto-cancellation
 */
export function startBookingMonitor(): void {
  if (monitorInterval) {
    console.log('⏰ Booking monitor already running');
    return;
  }

  console.log('⏰ Starting booking monitor worker (every 5 minutes)');
  
  // Run immediately on startup
  runMonitorCycle();
  
  // Then run every 5 minutes
  monitorInterval = setInterval(runMonitorCycle, MONITOR_INTERVAL_MS);
}

/**
 * Stop the booking monitor
 */
export function stopBookingMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('⏰ Booking monitor stopped');
  }
}

/**
 * Main monitor cycle - runs every 5 minutes
 */
async function runMonitorCycle(): Promise<void> {
  const startTime = Date.now();
  console.log('⏰ Running booking monitor cycle...');
  
  try {
    await processFirstReminders();
    await processSecondReminders();
    await processAutoCancellations();
    
    const duration = Date.now() - startTime;
    console.log(`⏰ Booking monitor cycle completed in ${duration}ms`);
  } catch (error) {
    console.error('❌ Booking monitor cycle error:', error);
  }
}

/**
 * Process first reminders (2 hours before pickup)
 */
async function processFirstReminders(): Promise<void> {
  try {
    const bookings = await storage.getBookingsNeedingFirstReminder();
    
    if (bookings.length === 0) {
      return;
    }
    
    console.log(`⏰ Found ${bookings.length} bookings needing first reminder (2 hours)`);
    
    for (const booking of bookings) {
      try {
        await sendFirstWarning(booking);
        await storage.markFirstReminderSent(booking.id);
        console.log(`✅ First reminder sent for booking ${booking.id}`);
      } catch (error) {
        console.error(`❌ Failed to send first reminder for booking ${booking.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error processing first reminders:', error);
  }
}

/**
 * Process second reminders (1 hour before pickup)
 */
async function processSecondReminders(): Promise<void> {
  try {
    const bookings = await storage.getBookingsNeedingSecondReminder();
    
    if (bookings.length === 0) {
      return;
    }
    
    console.log(`⏰ Found ${bookings.length} bookings needing second reminder (1 hour)`);
    
    for (const booking of bookings) {
      try {
        await sendSecondWarning(booking);
        await storage.markSecondReminderSent(booking.id);
        console.log(`✅ Second reminder sent for booking ${booking.id}`);
      } catch (error) {
        console.error(`❌ Failed to send second reminder for booking ${booking.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error processing second reminders:', error);
  }
}

/**
 * Process auto-cancellations for overdue bookings
 */
async function processAutoCancellations(): Promise<void> {
  try {
    const bookings = await storage.getOverdueBookingsForAutoCancellation();
    
    if (bookings.length === 0) {
      return;
    }
    
    console.log(`⏰ Found ${bookings.length} overdue bookings for auto-cancellation`);
    
    for (const booking of bookings) {
      try {
        await autoCancelBooking(booking);
        console.log(`🚫 Auto-cancelled booking ${booking.id} - scheduled time passed`);
      } catch (error) {
        console.error(`❌ Failed to auto-cancel booking ${booking.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error processing auto-cancellations:', error);
  }
}

/**
 * Send first warning notification (2 hours before pickup)
 */
async function sendFirstWarning(booking: any): Promise<void> {
  const scheduledTime = new Date(booking.scheduledDateTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Chicago'
  });

  // Get driver info if assigned
  let driverInfo = null;
  if (booking.driverId) {
    driverInfo = await storage.getUser(booking.driverId);
  }

  // Get passenger info
  const passenger = booking.passengerId ? await storage.getUser(booking.passengerId) : null;

  const warningMessage = `⚠️ URGENT: Booking #${booking.id.substring(0, 8).toUpperCase()} starts in 2 HOURS!

📍 Pickup: ${booking.pickupAddress}
📅 Time: ${scheduledTime}
${booking.driverId ? `🚗 Driver: ${driverInfo?.firstName} ${driverInfo?.lastName}` : '❗ NO DRIVER ASSIGNED'}

Please ensure the job is ready to start on time.`;

  // Send to driver
  if (driverInfo?.phone) {
    try {
      await sendSMS(driverInfo.phone, warningMessage);
    } catch (error) {
      console.error('Failed to send SMS to driver:', error);
    }
  }

  // Send to admin/dispatchers
  const adminUsers = await storage.getAllUsers();
  const adminsAndDispatchers = adminUsers.filter(u => 
    (u.role === 'admin' || u.role === 'dispatcher') && u.isActive
  );

  for (const admin of adminsAndDispatchers) {
    if (admin.phone) {
      try {
        await sendSMS(admin.phone, warningMessage);
      } catch (error) {
        console.error(`Failed to send SMS to admin ${admin.id}:`, error);
      }
    }
    if (admin.email) {
      try {
        await sendEmail({
          to: admin.email,
          subject: `⚠️ 2-Hour Warning: Booking #${booking.id.substring(0, 8).toUpperCase()}`,
          html: getWarningEmailHTML(booking, '2 hours', scheduledTime, driverInfo),
        });
      } catch (error) {
        console.error(`Failed to send email to admin ${admin.id}:`, error);
      }
    }
  }

  // TODO: Send push notifications when Firebase is configured
}

/**
 * Send second warning notification (1 hour before pickup)
 */
async function sendSecondWarning(booking: any): Promise<void> {
  const scheduledTime = new Date(booking.scheduledDateTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Chicago'
  });

  // Get driver info if assigned
  let driverInfo = null;
  if (booking.driverId) {
    driverInfo = await storage.getUser(booking.driverId);
  }

  const warningMessage = `🚨 FINAL WARNING: Booking #${booking.id.substring(0, 8).toUpperCase()} starts in 1 HOUR!

📍 Pickup: ${booking.pickupAddress}
📅 Time: ${scheduledTime}
${booking.driverId ? `🚗 Driver: ${driverInfo?.firstName} ${driverInfo?.lastName}` : '❗ NO DRIVER ASSIGNED - IMMEDIATE ACTION REQUIRED'}

This booking will be auto-cancelled if not started on time!`;

  // Send to driver
  if (driverInfo?.phone) {
    try {
      await sendSMS(driverInfo.phone, warningMessage);
    } catch (error) {
      console.error('Failed to send SMS to driver:', error);
    }
  }

  // Send to admin/dispatchers
  const adminUsers = await storage.getAllUsers();
  const adminsAndDispatchers = adminUsers.filter(u => 
    (u.role === 'admin' || u.role === 'dispatcher') && u.isActive
  );

  for (const admin of adminsAndDispatchers) {
    if (admin.phone) {
      try {
        await sendSMS(admin.phone, warningMessage);
      } catch (error) {
        console.error(`Failed to send SMS to admin ${admin.id}:`, error);
      }
    }
    if (admin.email) {
      try {
        await sendEmail({
          to: admin.email,
          subject: `🚨 FINAL WARNING: Booking #${booking.id.substring(0, 8).toUpperCase()} in 1 HOUR`,
          html: getWarningEmailHTML(booking, '1 hour', scheduledTime, driverInfo),
        });
      } catch (error) {
        console.error(`Failed to send email to admin ${admin.id}:`, error);
      }
    }
  }

  // TODO: Send push notifications when Firebase is configured
}

/**
 * Auto-cancel an overdue booking
 */
async function autoCancelBooking(booking: any): Promise<void> {
  const now = new Date();
  const cancellationReason = 'Scheduled time passed - automatically cancelled by system';

  // Update booking status
  await storage.updateBooking(booking.id, {
    status: 'cancelled',
    cancelledAt: now,
    autoCancelledAt: now,
    cancelReason: cancellationReason,
  });

  // Create cancellation record
  await storage.createBookingCancellation({
    bookingId: booking.id,
    cancelledBy: 'system',
    reason: cancellationReason,
  });

  const scheduledTime = new Date(booking.scheduledDateTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Chicago'
  });

  const cancellationMessage = `🚫 AUTO-CANCELLED: Booking #${booking.id.substring(0, 8).toUpperCase()}

The scheduled pickup time has passed without the job being started.

📍 Pickup: ${booking.pickupAddress}
📅 Was scheduled for: ${scheduledTime}
💰 Amount: $${booking.totalAmount}

Reason: Scheduled time passed`;

  // Get driver info if assigned
  let driverInfo = null;
  if (booking.driverId) {
    driverInfo = await storage.getUser(booking.driverId);
    
    // Notify driver
    if (driverInfo?.phone) {
      try {
        await sendSMS(driverInfo.phone, cancellationMessage);
      } catch (error) {
        console.error('Failed to send cancellation SMS to driver:', error);
      }
    }
  }

  // Get passenger info
  const passenger = booking.passengerId ? await storage.getUser(booking.passengerId) : null;

  // Notify passenger
  if (passenger?.phone) {
    try {
      await sendSMS(passenger.phone, `We're sorry, but your booking #${booking.id.substring(0, 8).toUpperCase()} scheduled for ${scheduledTime} has been cancelled as the scheduled time has passed. Please contact us if you have any questions.`);
    } catch (error) {
      console.error('Failed to send cancellation SMS to passenger:', error);
    }
  }

  if (passenger?.email) {
    try {
      await sendEmail({
        to: passenger.email,
        subject: `Booking Cancelled - #${booking.id.substring(0, 8).toUpperCase()}`,
        html: getAutoCancellationEmailHTML(booking, scheduledTime),
      });
    } catch (error) {
      console.error('Failed to send cancellation email to passenger:', error);
    }
  }

  // Notify admin/dispatchers
  const adminUsers = await storage.getAllUsers();
  const adminsAndDispatchers = adminUsers.filter(u => 
    (u.role === 'admin' || u.role === 'dispatcher') && u.isActive
  );

  for (const admin of adminsAndDispatchers) {
    if (admin.email) {
      try {
        await sendEmail({
          to: admin.email,
          subject: `🚫 Auto-Cancelled: Booking #${booking.id.substring(0, 8).toUpperCase()}`,
          html: getAutoCancellationEmailHTML(booking, scheduledTime),
        });
      } catch (error) {
        console.error(`Failed to send email to admin ${admin.id}:`, error);
      }
    }
  }
}

/**
 * Generate warning email HTML
 */
function getWarningEmailHTML(booking: any, timeLeft: string, scheduledTime: string, driverInfo: any): string {
  const isUrgent = timeLeft === '1 hour';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${isUrgent ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">${isUrgent ? '🚨 FINAL WARNING' : '⚠️ Reminder'}</h1>
    <p style="margin: 5px 0 0; opacity: 0.9;">Booking starts in ${timeLeft}</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Booking <strong>#${booking.id.substring(0, 8).toUpperCase()}</strong> is scheduled to start soon.
    </p>
    
    <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <p style="margin: 0 0 10px;"><strong>📍 Pickup:</strong> ${booking.pickupAddress}</p>
      <p style="margin: 0 0 10px;"><strong>📅 Time:</strong> ${scheduledTime}</p>
      ${booking.destinationAddress ? `<p style="margin: 0 0 10px;"><strong>📍 Destination:</strong> ${booking.destinationAddress}</p>` : ''}
      <p style="margin: 0 0 10px;"><strong>💰 Amount:</strong> $${booking.totalAmount}</p>
      <p style="margin: 0;"><strong>🚗 Driver:</strong> ${driverInfo ? `${driverInfo.firstName} ${driverInfo.lastName}` : '<span style="color: #dc2626;">NOT ASSIGNED</span>'}</p>
    </div>
    
    ${!driverInfo ? `
    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <p style="margin: 0; color: #dc2626; font-weight: bold;">⚠️ No driver is assigned to this booking! Please assign a driver immediately.</p>
    </div>
    ` : ''}
    
    ${isUrgent ? `
    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <p style="margin: 0; color: #dc2626; font-weight: bold;">This booking will be automatically cancelled if not started on time!</p>
    </div>
    ` : ''}
    
    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      This is an automated reminder from the booking system.
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate auto-cancellation email HTML
 */
function getAutoCancellationEmailHTML(booking: any, scheduledTime: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🚫 Booking Auto-Cancelled</h1>
    <p style="margin: 5px 0 0; opacity: 0.9;">Scheduled time has passed</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Booking <strong>#${booking.id.substring(0, 8).toUpperCase()}</strong> has been automatically cancelled because the scheduled pickup time has passed without the trip being started.
    </p>
    
    <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <p style="margin: 0 0 10px;"><strong>📍 Pickup:</strong> ${booking.pickupAddress}</p>
      <p style="margin: 0 0 10px;"><strong>📅 Was scheduled for:</strong> ${scheduledTime}</p>
      ${booking.destinationAddress ? `<p style="margin: 0 0 10px;"><strong>📍 Destination:</strong> ${booking.destinationAddress}</p>` : ''}
      <p style="margin: 0;"><strong>💰 Amount:</strong> $${booking.totalAmount}</p>
    </div>
    
    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <p style="margin: 0; color: #dc2626;"><strong>Reason:</strong> Scheduled time passed - automatically cancelled by system</p>
    </div>
    
    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      If you have any questions, please contact our support team.
    </p>
  </div>
</body>
</html>
  `;
}
