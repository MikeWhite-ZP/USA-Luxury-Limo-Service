import { storage } from './storage';
import { sendSMS } from './sms';
import { sendEmail } from './email';
import { sendCancelledBookingReport } from './emailReports';

/**
 * Auto-cancel bookings that are past their scheduled time
 * and haven't progressed beyond 'confirmed' status
 */
export async function autoCancelExpiredBookings() {
  try {
    const now = new Date();
    
    // Get all bookings that are past scheduled time and not progressed
    const bookings = await storage.getAllBookings();
    
    for (const booking of bookings) {
      const scheduledTime = new Date(booking.scheduledDateTime);
      const minutesPast = (now.getTime() - scheduledTime.getTime()) / (1000 * 60);
      
      // Auto-cancel if:
      // 1. Scheduled time has passed by more than 30 minutes
      // 2. Has a driver assigned (driverId exists)
      // 3. Status is confirmed/on_the_way/arrived/on_board (driver accepted but hasn't completed)
      // 4. Not already cancelled or auto-cancelled
      const shouldCancel = 
        minutesPast > 30 &&
        booking.driverId &&
        booking.status &&
        ['confirmed', 'on_the_way', 'arrived', 'on_board'].includes(booking.status) &&
        !booking.autoCancelledAt;
      
      if (shouldCancel) {
        console.log(`[AUTO-CANCEL] Cancelling expired booking ${booking.id}`);
        
        const updatedBooking = await storage.updateBooking(booking.id, {
          status: 'cancelled' as any,
          autoCancelledAt: now,
          cancelReason: 'Automatically cancelled - scheduled time passed without driver starting trip',
        });
        
        // Notify passenger
        try {
          const passenger = await storage.getUser(booking.passengerId);
          if (passenger?.phone) {
            await sendSMS(
              passenger.phone,
              `Your ride scheduled for ${scheduledTime.toLocaleString()} has been automatically cancelled as the scheduled time passed. Please book again if needed. Booking #${booking.id.substring(0, 8)}`
            );
          }
          if (passenger?.email) {
            await sendEmail({
              to: passenger.email,
              subject: 'Ride Automatically Cancelled',
              html: `
                <h2>Ride Cancelled</h2>
                <p>Your ride scheduled for ${scheduledTime.toLocaleString()} has been automatically cancelled as the scheduled time has passed.</p>
                <p><strong>Booking ID:</strong> ${booking.id.substring(0, 8)}</p>
                <p><strong>Pickup:</strong> ${booking.pickupAddress}</p>
                <p>Please book again if you still need transportation.</p>
              `,
            });
          }
          
          // Send system admin cancellation report
          if (passenger) {
            const vehicleType = await storage.getVehicleType(booking.vehicleTypeId);
            if (vehicleType) {
              await sendCancelledBookingReport(
                updatedBooking,
                passenger,
                vehicleType.name || 'Unknown Vehicle',
                'system',
                'Automatically cancelled - scheduled time passed without driver starting trip'
              );
            }
          }
        } catch (error) {
          console.error('[AUTO-CANCEL] Failed to send notification:', error);
        }
      }
    }
  } catch (error) {
    console.error('[AUTO-CANCEL] Error in auto-cancel job:', error);
  }
}

/**
 * Send 2-hour advance reminders to drivers for upcoming jobs
 */
export async function sendDriverReminders() {
  try {
    const now = new Date();
    
    const bookings = await storage.getAllBookings();
    
    for (const booking of bookings) {
      // Only send reminders for confirmed bookings with a driver assigned
      // Don't send reminders for already started trips (on_the_way or later)
      if (!booking.driverId || 
          !booking.status ||
          booking.status !== 'confirmed' || // Only confirmed, not yet started
          booking.reminderSentAt) { // Already sent
        continue;
      }
      
      const scheduledTime = new Date(booking.scheduledDateTime);
      const minutesUntil = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
      
      // Send reminder exactly when 120 minutes remain (within 5 min window for job execution tolerance)
      const shouldSendReminder = 
        minutesUntil > 115 && minutesUntil <= 125;
      
      if (shouldSendReminder) {
        console.log(`[REMINDER] Sending 2-hour reminder for booking ${booking.id}`);
        
        // Mark reminder as sent
        await storage.updateBooking(booking.id, {
          reminderSentAt: now,
        });
        
        try {
          const driver = await storage.getDriver(booking.driverId);
          const driverUser = driver ? await storage.getUser(driver.userId) : null;
          
          if (driverUser?.phone) {
            await sendSMS(
              driverUser.phone,
              `⏰ REMINDER: You have a ride in 2 hours!\n` +
              `Pickup: ${scheduledTime.toLocaleString()}\n` +
              `Location: ${booking.pickupAddress}\n` +
              `Payment: $${booking.driverPayment || 'TBD'}\n` +
              `Booking #${booking.id.substring(0, 8)}`
            );
          }
          
          if (driverUser?.email) {
            await sendEmail({
              to: driverUser.email,
              subject: '⏰ Upcoming Ride Reminder - 2 Hours',
              html: `
                <h2>Upcoming Ride Reminder</h2>
                <p>You have a ride starting in approximately 2 hours.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p><strong>Scheduled Pickup:</strong> ${scheduledTime.toLocaleString()}</p>
                  <p><strong>Pickup Location:</strong> ${booking.pickupAddress}</p>
                  ${booking.destinationAddress ? `<p><strong>Destination:</strong> ${booking.destinationAddress}</p>` : ''}
                  <p><strong>Passengers:</strong> ${booking.passengerCount}</p>
                  <p><strong>Your Payment:</strong> $${booking.driverPayment || 'Not set'}</p>
                  <p><strong>Booking ID:</strong> ${booking.id.substring(0, 8)}</p>
                </div>
                <p>You can now mark yourself as "On the Way" from your driver dashboard.</p>
              `,
            });
          }
        } catch (error) {
          console.error('[REMINDER] Failed to send driver reminder:', error);
        }
      }
    }
  } catch (error) {
    console.error('[REMINDER] Error in reminder job:', error);
  }
}

/**
 * Start all scheduled jobs
 * Runs auto-cancel every 5 minutes
 * Runs reminder check every 5 minutes
 */
export function startScheduledJobs() {
  console.log('[SCHEDULED JOBS] Starting scheduled jobs...');
  
  // Run immediately on startup
  autoCancelExpiredBookings();
  sendDriverReminders();
  
  // Run auto-cancel every 5 minutes
  setInterval(autoCancelExpiredBookings, 5 * 60 * 1000);
  
  // Run reminder check every 5 minutes
  setInterval(sendDriverReminders, 5 * 60 * 1000);
  
  console.log('[SCHEDULED JOBS] Scheduled jobs started successfully');
}
