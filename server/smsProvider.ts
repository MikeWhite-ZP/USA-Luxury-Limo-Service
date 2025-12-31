import { getTwilioClient, getTwilioFromPhoneNumber, isTwilioEnabled } from './twilio';
import { storage } from './storage';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: 'TWILIO' | 'ANDROID_SMS';
}

export interface SMSProvider {
  name: 'TWILIO' | 'ANDROID_SMS';
  send(to: string, message: string): Promise<SMSResult>;
  isEnabled(): Promise<boolean>;
}

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

export class TwilioProvider implements SMSProvider {
  name: 'TWILIO' = 'TWILIO';

  async send(to: string, message: string): Promise<SMSResult> {
    try {
      const normalizedPhone = normalizePhoneNumber(to);
      
      if (!normalizedPhone) {
        console.warn(`[TWILIO] Invalid phone number format: ${to}`);
        return {
          success: false,
          error: 'Invalid phone number format',
          provider: 'TWILIO'
        };
      }

      const client = await getTwilioClient();
      const fromNumber = await getTwilioFromPhoneNumber();

      if (!fromNumber) {
        throw new Error('Twilio phone number not configured');
      }

      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: normalizedPhone
      });

      console.log(`[TWILIO] SMS sent successfully to ${normalizedPhone}, SID: ${result.sid}`);
      
      return {
        success: true,
        messageId: result.sid,
        provider: 'TWILIO'
      };
    } catch (error) {
      console.error('[TWILIO] Failed to send SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'TWILIO'
      };
    }
  }

  async isEnabled(): Promise<boolean> {
    return isTwilioEnabled();
  }
}

export class AndroidSmsProvider implements SMSProvider {
  name: 'ANDROID_SMS' = 'ANDROID_SMS';

  async send(to: string, message: string): Promise<SMSResult> {
    try {
      const normalizedPhone = normalizePhoneNumber(to);
      
      if (!normalizedPhone) {
        console.warn(`[ANDROID_SMS] Invalid phone number format: ${to}`);
        return {
          success: false,
          error: 'Invalid phone number format',
          provider: 'ANDROID_SMS'
        };
      }

      const queueItem = await storage.addToAndroidSmsQueue({
        phoneNumber: normalizedPhone,
        message: message,
        status: 'PENDING',
        priority: 0,
        retryCount: 0,
        maxRetries: 3
      });

      console.log(`[ANDROID_SMS] Message queued with ID: ${queueItem.id}`);
      
      return {
        success: true,
        messageId: queueItem.id,
        provider: 'ANDROID_SMS'
      };
    } catch (error) {
      console.error('[ANDROID_SMS] Failed to queue SMS, will trigger fallback:', error);
      return {
        success: false,
        error: `Queue error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider: 'ANDROID_SMS'
      };
    }
  }

  async isEnabled(): Promise<boolean> {
    try {
      const activeDevices = await storage.getActiveAndroidSmsDevices();
      if (activeDevices.length === 0) {
        return false;
      }
      
      const HEARTBEAT_TIMEOUT_MS = 10 * 60 * 1000;
      const now = Date.now();
      
      const recentlyActiveDevices = activeDevices.filter(device => {
        if (!device.lastHeartbeat) return false;
        const lastHeartbeatMs = new Date(device.lastHeartbeat).getTime();
        return (now - lastHeartbeatMs) < HEARTBEAT_TIMEOUT_MS;
      });
      
      return recentlyActiveDevices.length > 0;
    } catch (error) {
      console.error('[ANDROID_SMS] Error checking enabled status:', error);
      return false;
    }
  }
}

export type SmsProviderType = 'TWILIO' | 'ANDROID_SMS';

const twilioProvider = new TwilioProvider();
const androidSmsProvider = new AndroidSmsProvider();

export async function getSmsProvider(): Promise<SMSProvider> {
  const providerSetting = await storage.getSetting('SMS_PROVIDER');
  const providerType: SmsProviderType = (providerSetting?.value as SmsProviderType) || 'TWILIO';
  
  if (providerType === 'ANDROID_SMS') {
    const isAndroidEnabled = await androidSmsProvider.isEnabled();
    if (isAndroidEnabled) {
      return androidSmsProvider;
    }
    console.log('[SMS] Android SMS not available (no active devices), falling back to Twilio');
  }
  
  return twilioProvider;
}

export async function getCurrentSmsProviderType(): Promise<SmsProviderType> {
  const providerSetting = await storage.getSetting('SMS_PROVIDER');
  return (providerSetting?.value as SmsProviderType) || 'TWILIO';
}

export async function setSmsProvider(providerType: SmsProviderType, userId: string): Promise<void> {
  await storage.setSetting('SMS_PROVIDER', providerType, userId);
  console.log(`[SMS] Provider changed to: ${providerType}`);
}

export async function sendWithFallback(to: string, message: string): Promise<SMSResult> {
  const provider = await getSmsProvider();
  const result = await provider.send(to, message);
  
  if (!result.success && provider.name === 'ANDROID_SMS') {
    console.log('[SMS] Android SMS failed, attempting Twilio fallback...');
    const twilioResult = await twilioProvider.send(to, message);
    if (twilioResult.success) {
      console.log('[SMS] Twilio fallback succeeded');
    }
    return twilioResult;
  }
  
  return result;
}

export { twilioProvider, androidSmsProvider };
