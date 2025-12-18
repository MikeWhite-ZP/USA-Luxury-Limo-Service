import twilio from 'twilio';
import { storage } from '../storage';
import { SMSProvider, SMSResult } from './types';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

async function getCredentials() {
  const dbAccountSid = await storage.getSetting('TWILIO_ACCOUNT_SID');
  const dbAuthToken = await storage.getSetting('TWILIO_AUTH_TOKEN');
  const dbPhoneNumber = await storage.getSetting('TWILIO_PHONE_NUMBER');

  if (dbAccountSid?.value && dbAuthToken?.value && dbPhoneNumber?.value) {
    return {
      accountSid: dbAccountSid.value,
      authToken: dbAuthToken.value,
      phoneNumber: dbPhoneNumber.value,
      source: 'database' as const
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error('Twilio credentials not configured');
  }

  return {
    accountSid,
    authToken,
    phoneNumber,
    source: 'environment' as const
  };
}

function normalizePhoneNumber(phoneNumber: string): string | null {
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

export class TwilioProvider implements SMSProvider {
  name = 'Twilio';

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
      const normalizedPhone = normalizePhoneNumber(to);
      
      if (!normalizedPhone) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      const { accountSid, authToken, phoneNumber } = await getCredentials();
      const client = twilio(accountSid, authToken);

      const result = await client.messages.create({
        body: message,
        from: phoneNumber,
        to: normalizedPhone
      });

      console.log(`[Twilio] SMS sent successfully to ${normalizedPhone}, SID: ${result.sid}`);
      
      return {
        success: true,
        messageId: result.sid
      };
    } catch (error) {
      console.error('[Twilio] Failed to send SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const { accountSid, authToken } = await getCredentials();
      const client = twilio(accountSid, authToken);
      await client.api.accounts(accountSid).fetch();
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async isConfigured(): Promise<boolean> {
    try {
      await getCredentials();
      return true;
    } catch {
      return false;
    }
  }
}

export const twilioProvider = new TwilioProvider();
