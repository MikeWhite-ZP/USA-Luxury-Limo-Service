import { 
  sendSMS as sendSMSViaGateway, 
  isSMSEnabled, 
  getActiveGateway, 
  setActiveGateway, 
  getGatewayStatus,
  testSMSConnection,
  SMSResult,
  SMSGatewayType
} from './sms-providers';
import { getTwilioConnectionStatus, isTwilioEnabled } from './twilio';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { getBrandingInfo } from './email';

export { SMSResult, SMSGatewayType } from './sms-providers';

export function normalizePhoneNumber(phoneNumber: string): string | null {
  try {
    if (phoneNumber.startsWith('+')) {
      if (isValidPhoneNumber(phoneNumber)) {
        const parsed = parsePhoneNumber(phoneNumber);
        return parsed.format('E.164');
      }
      return null;
    }
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      const usNumber = `+1${cleaned}`;
      if (isValidPhoneNumber(usNumber)) {
        return usNumber;
      }
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const usNumber = `+${cleaned}`;
      if (isValidPhoneNumber(usNumber)) {
        return usNumber;
      }
    }
    
    if (isValidPhoneNumber(phoneNumber, 'US')) {
      const parsed = parsePhoneNumber(phoneNumber, 'US');
      return parsed.format('E.164');
    }
    
    return null;
  } catch (error) {
    console.error('Phone number normalization error:', error);
    return null;
  }
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  return sendSMSViaGateway(to, message);
}

export { isSMSEnabled, getActiveGateway, setActiveGateway, getGatewayStatus, testSMSConnection };

export async function sendBookingConfirmationSMS(
  phoneNumber: string,
  bookingId: string,
  pickupAddress: string,
  scheduledTime: Date
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  const message = `${branding.companyName} - Booking Confirmed!\n\nBooking ID: ${bookingId.substring(0, 8)}\nPickup: ${pickupAddress}\nTime: ${scheduledTime.toLocaleString()}\n\nThank you for choosing ${branding.companyName}!`;
  
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

  const message = `${branding.companyName} - Booking Update\n\nBooking ID: ${bookingId.substring(0, 8)}\nStatus: ${status.toUpperCase()}\n\n${statusMessages[status] || 'Your booking status has been updated.'}`;
  
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
  const message = `${branding.companyName} - New Ride Assignment\n\nPassenger: ${passengerName}\nPickup: ${pickupAddress}\nTime: ${scheduledTime.toLocaleString()}${paymentInfo}\n\nPlease check your driver dashboard for details.`;
  
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
  const message = `${branding.companyName} - Driver On The Way!\n\nYour driver ${driverName} is heading to your pickup location in a ${vehicleType}.${arrivalInfo}\n\nPlease be ready!`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendDriverArrivedSMS(
  phoneNumber: string,
  driverName: string,
  vehicleType: string,
  pickupAddress: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  const message = `${branding.companyName} - Driver Arrived!\n\nYour driver ${driverName} has arrived at ${pickupAddress}. Please proceed to your ${vehicleType}.\n\nThank you!`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendBookingCancelledSMS(
  phoneNumber: string,
  bookingId: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  const message = `${branding.companyName} - Booking Cancelled\n\nBooking ID: ${bookingId.substring(0, 8)}\n\nYour booking has been cancelled. For assistance, please contact us.`;
  
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
  const message = `${branding.companyName} - NEW BOOKING\n\nID: ${bookingId.substring(0, 8)}\nPassenger: ${passengerName}\nPickup: ${pickupAddress}\nTime: ${scheduledTime.toLocaleString()}\nAmount: $${totalAmount}\n\nCheck admin dashboard for details.`;
  
  return sendSMS(phoneNumber, message);
}

// Password Reset SMS Templates

export async function sendPasswordResetSMS(
  phone: string,
  resetToken: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const message = `${branding.companyName}: Reset your password using this link: ${resetUrl} (expires in 1 hour). If you didn't request this, ignore this message.`;
  
  return sendSMS(phone, message);
}

export async function sendTemporaryPasswordSMS(
  phone: string,
  tempPassword: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  const message = `${branding.companyName}: Your temporary password is: ${tempPassword}. Please change it after logging in.`;
  
  return sendSMS(phone, message);
}

export async function sendUsernameReminderSMS(
  phone: string,
  username: string
): Promise<SMSResult> {
  const branding = await getBrandingInfo();
  const message = `${branding.companyName}: Your username is: ${username}`;
  
  return sendSMS(phone, message);
}

export { getTwilioConnectionStatus, isTwilioEnabled };
