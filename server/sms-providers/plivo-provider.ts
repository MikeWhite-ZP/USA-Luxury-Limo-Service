import plivo from 'plivo';
import { storage } from '../storage';
import { SMSProvider, SMSResult } from './types';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

async function getCredentials() {
  const dbAuthId = await storage.getSetting('PLIVO_AUTH_ID');
  const dbAuthToken = await storage.getSetting('PLIVO_AUTH_TOKEN');
  const dbPhoneNumber = await storage.getSetting('PLIVO_PHONE_NUMBER');

  if (dbAuthId?.value && dbAuthToken?.value && dbPhoneNumber?.value) {
    return {
      authId: dbAuthId.value,
      authToken: dbAuthToken.value,
      phoneNumber: dbPhoneNumber.value,
      source: 'database' as const
    };
  }

  const authId = process.env.PLIVO_AUTH_ID;
  const authToken = process.env.PLIVO_AUTH_TOKEN;
  const phoneNumber = process.env.PLIVO_PHONE_NUMBER;

  if (!authId || !authToken || !phoneNumber) {
    throw new Error('Plivo credentials not configured');
  }

  return {
    authId,
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

export class PlivoProvider implements SMSProvider {
  name = 'Plivo';

  private async getClient(): Promise<plivo.Client> {
    const { authId, authToken } = await getCredentials();
    return new plivo.Client(authId, authToken);
  }

  async sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
      const normalizedPhone = normalizePhoneNumber(to);
      
      if (!normalizedPhone) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      const client = await this.getClient();
      const { phoneNumber } = await getCredentials();

      const result = await client.messages.create(
        phoneNumber,
        normalizedPhone,
        message
      );

      console.log(`[Plivo] SMS sent successfully to ${normalizedPhone}, MessageUUID: ${result.messageUuid}`);
      
      return {
        success: true,
        messageId: Array.isArray(result.messageUuid) ? result.messageUuid[0] : result.messageUuid
      };
    } catch (error) {
      console.error('[Plivo] Failed to send SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const client = await this.getClient();
      await client.accounts.get();
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

export const plivoProvider = new PlivoProvider();
