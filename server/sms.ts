import { getTwilioClient, getTwilioFromPhoneNumber, getTwilioConnectionStatus } from './twilio';

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  try {
    const client = await getTwilioClient();
    const fromNumber = await getTwilioFromPhoneNumber();

    if (!fromNumber) {
      throw new Error('Twilio phone number not configured');
    }

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    console.log(`SMS sent successfully to ${to}, SID: ${result.sid}`);
    
    return {
      success: true,
      messageId: result.sid
    };
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
  const message = `USA Luxury Limo - Booking Confirmed!\n\nBooking ID: ${bookingId.substring(0, 8)}\nPickup: ${pickupAddress}\nTime: ${scheduledTime.toLocaleString()}\n\nThank you for choosing USA Luxury Limo!`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendBookingStatusUpdateSMS(
  phoneNumber: string,
  bookingId: string,
  status: string
): Promise<SMSResult> {
  const statusMessages: Record<string, string> = {
    confirmed: 'Your booking has been confirmed and a driver will be assigned soon.',
    in_progress: 'Your driver is on the way to pick you up!',
    completed: 'Thank you for riding with USA Luxury Limo. We hope you enjoyed your trip!',
    cancelled: 'Your booking has been cancelled. If you need assistance, please contact us.'
  };

  const message = `USA Luxury Limo - Booking Update\n\nBooking ID: ${bookingId.substring(0, 8)}\nStatus: ${status.toUpperCase()}\n\n${statusMessages[status] || 'Your booking status has been updated.'}`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendDriverAssignmentSMS(
  phoneNumber: string,
  passengerName: string,
  pickupAddress: string,
  scheduledTime: Date
): Promise<SMSResult> {
  const message = `USA Luxury Limo - New Ride Assignment\n\nPassenger: ${passengerName}\nPickup: ${pickupAddress}\nTime: ${scheduledTime.toLocaleString()}\n\nPlease check your driver dashboard for details.`;
  
  return sendSMS(phoneNumber, message);
}

export async function sendTestSMS(phoneNumber: string): Promise<SMSResult> {
  const message = `USA Luxury Limo - Test SMS\n\nThis is a test message from your SMS notification system. If you received this, your Twilio integration is working correctly!`;
  
  return sendSMS(phoneNumber, message);
}

export { getTwilioConnectionStatus };
