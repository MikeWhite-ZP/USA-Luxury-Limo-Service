import { getTwilioConnectionStatus, isTwilioEnabled } from './twilio';
import { getBrandingInfo } from './email';
import { getSmsProvider, getCurrentSmsProviderType, normalizePhoneNumber, sendWithFallback, twilioProvider, type SMSResult } from './smsProvider';
import { getSmsTemplate } from './templateUtils';

export { normalizePhoneNumber, type SMSResult, getCurrentSmsProviderType };
export { isTwilioEnabled, getTwilioConnectionStatus };

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  try {
    const provider = await getSmsProvider();
    
    const enabled = await provider.isEnabled();
    if (!enabled) {
      if (provider.name === 'ANDROID_SMS') {
        console.log('[SMS] Android SMS not available, using Twilio fallback');
        const twilioEnabled = await twilioProvider.isEnabled();
        if (twilioEnabled) {
          return twilioProvider.send(to, message);
        }
      }
      console.log(`SMS sending skipped: ${provider.name} is disabled or not available`);
      return {
        success: false,
        error: 'SMS notifications are disabled'
      };
    }

    const result = await sendWithFallback(to, message);
    return result;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function sendBookingConfirmationSMS(
  phoneNumber: string,
  bookingId: string,
  pickupAddress: string,
  scheduledTime: Date
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  
  const templateData = {
    company_name: branding.companyName,
    booking_id: bookingId.substring(0, 8),
    pickup_location: pickupAddress,
    scheduled_time: scheduledTime.toLocaleString(),
  };
  
  const dbTemplate = await getSmsTemplate('sms_booking_confirmation', templateData);
  
  const message = dbTemplate.found
    ? dbTemplate.content
    : `${branding.companyName} - Booking Confirmed!\n\nBooking ID: ${bookingId.substring(0, 8)}\nPickup: ${pickupAddress}\nTime: ${scheduledTime.toLocaleString()}\n\nThank you for choosing ${branding.companyName}!`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendBookingStatusUpdateSMS(
  phoneNumber: string,
  bookingId: string,
  status: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  const statusMessages: Record<string, string> = {
    confirmed: 'Your booking has been confirmed and a driver will be assigned soon.',
    in_progress: 'Your driver is on the way to pick you up!',
    completed: `Thank you for riding with ${branding.companyName}. We hope you enjoyed your trip!`,
    cancelled: 'Your booking has been cancelled. If you need assistance, please contact us.'
  };

  const templateData = {
    company_name: branding.companyName,
    booking_id: bookingId.substring(0, 8),
    status: status.toUpperCase(),
    status_message: statusMessages[status] || 'Your booking status has been updated.',
  };

  const dbTemplate = await getSmsTemplate('sms_booking_status_update', templateData);

  const message = dbTemplate.found
    ? dbTemplate.content
    : `${branding.companyName} - Booking Update\n\nBooking ID: ${bookingId.substring(0, 8)}\nStatus: ${status.toUpperCase()}\n\n${statusMessages[status] || 'Your booking status has been updated.'}`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendDriverAssignmentSMS(
  phoneNumber: string,
  passengerName: string,
  pickupAddress: string,
  scheduledTime: Date,
  driverPayment?: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  const paymentInfo = driverPayment ? `\nYour Payment: $${driverPayment}` : '';
  
  const templateData = {
    company_name: branding.companyName,
    passenger_name: passengerName,
    pickup_location: pickupAddress,
    scheduled_time: scheduledTime.toLocaleString(),
    driver_payment: driverPayment || '',
    payment_info: paymentInfo,
  };
  
  const dbTemplate = await getSmsTemplate('sms_driver_assignment', templateData);

  const message = dbTemplate.found
    ? dbTemplate.content
    : `${branding.companyName} - New Ride Assignment\n\nPassenger: ${passengerName}\nPickup: ${pickupAddress}\nTime: ${scheduledTime.toLocaleString()}${paymentInfo}\n\nPlease check your driver dashboard for details.`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendTestSMS(phoneNumber: string): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  const message = `${branding.companyName} - Test SMS\n\nThis is a test message from your SMS notification system. If you received this, your Twilio integration is working correctly!`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendDriverOnTheWaySMS(
  phoneNumber: string,
  driverName: string,
  vehicleType: string,
  estimatedArrival?: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  const arrivalInfo = estimatedArrival ? `\nETA: ${estimatedArrival}` : '';
  
  const templateData = {
    company_name: branding.companyName,
    driver_name: driverName,
    vehicle_type: vehicleType,
    estimated_arrival: estimatedArrival || '',
    arrival_info: arrivalInfo,
  };
  
  const dbTemplate = await getSmsTemplate('sms_driver_on_the_way', templateData);

  const message = dbTemplate.found
    ? dbTemplate.content
    : `${branding.companyName} - Driver On The Way!\n\nYour driver ${driverName} is heading to your pickup location in a ${vehicleType}.${arrivalInfo}\n\nPlease be ready!`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendDriverArrivedSMS(
  phoneNumber: string,
  driverName: string,
  vehicleType: string,
  pickupAddress: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  
  const templateData = {
    company_name: branding.companyName,
    driver_name: driverName,
    vehicle_type: vehicleType,
    pickup_location: pickupAddress,
  };
  
  const dbTemplate = await getSmsTemplate('sms_driver_arrived', templateData);

  const message = dbTemplate.found
    ? dbTemplate.content
    : `${branding.companyName} - Driver Arrived!\n\nYour driver ${driverName} has arrived at ${pickupAddress}. Please proceed to your ${vehicleType}.\n\nThank you!`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendBookingCancelledSMS(
  phoneNumber: string,
  bookingId: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  
  const templateData = {
    company_name: branding.companyName,
    booking_id: bookingId.substring(0, 8),
  };
  
  const dbTemplate = await getSmsTemplate('sms_booking_cancelled', templateData);

  const message = dbTemplate.found
    ? dbTemplate.content
    : `${branding.companyName} - Booking Cancelled\n\nBooking ID: ${bookingId.substring(0, 8)}\n\nYour booking has been cancelled. For assistance, please contact us.`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendAdminNewBookingAlertSMS(
  phoneNumber: string,
  bookingId: string,
  passengerName: string,
  pickupAddress: string,
  scheduledTime: Date,
  totalAmount: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  
  const templateData = {
    company_name: branding.companyName,
    booking_id: bookingId.substring(0, 8),
    passenger_name: passengerName,
    pickup_location: pickupAddress,
    scheduled_time: scheduledTime.toLocaleString(),
    total_amount: totalAmount,
  };
  
  const dbTemplate = await getSmsTemplate('sms_admin_new_booking', templateData);

  const message = dbTemplate.found
    ? dbTemplate.content
    : `${branding.companyName} - NEW BOOKING\n\nID: ${bookingId.substring(0, 8)}\nPassenger: ${passengerName}\nPickup: ${pickupAddress}\nTime: ${scheduledTime.toLocaleString()}\nAmount: $${totalAmount}\n\nCheck admin dashboard for details.`;
  
  return sendSMS(phoneNumber, message);
}

// Password Reset SMS Templates

export async function sendPasswordResetSMS(
  phone: string,
  resetToken: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const templateData = {
    company_name: branding.companyName,
    reset_link: resetUrl,
  };
  
  const dbTemplate = await getSmsTemplate('sms_password_reset', templateData);

  const message = dbTemplate.found
    ? dbTemplate.content
    : `${branding.companyName}: Reset your password using this link: ${resetUrl} (expires in 1 hour). If you didn't request this, ignore this message.`;
  
  return sendSMS(phone, message);
}

export async function sendTemporaryPasswordSMS(
  phone: string,
  tempPassword: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  
  const templateData = {
    company_name: branding.companyName,
    temporary_password: tempPassword,
  };
  
  const dbTemplate = await getSmsTemplate('sms_temporary_password', templateData);

  const message = dbTemplate.found
    ? dbTemplate.content
    : `${branding.companyName}: Your temporary password is: ${tempPassword}. Please change it after logging in.`;
  
  return sendSMS(phone, message);
}

export async function sendUsernameReminderSMS(
  phone: string,
  username: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  
  const templateData = {
    company_name: branding.companyName,
    username: username,
  };
  
  const dbTemplate = await getSmsTemplate('sms_username_reminder', templateData);

  const message = dbTemplate.found
    ? dbTemplate.content
    : `${branding.companyName}: Your username is: ${username}`;
  
  return sendSMS(phone, message);
}
