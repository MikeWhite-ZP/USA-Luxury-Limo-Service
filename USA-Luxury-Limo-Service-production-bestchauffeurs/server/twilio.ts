import twilio from 'twilio';
import { storage } from './storage';

async function getCredentials() {
  // First try to get credentials from database
  const dbAccountSid = await storage.getSetting('TWILIO_ACCOUNT_SID');
  const dbAuthToken = await storage.getSetting('TWILIO_AUTH_TOKEN');
  const dbPhoneNumber = await storage.getSetting('TWILIO_PHONE_NUMBER');

  // If all credentials exist in database, use them
  if (dbAccountSid?.value && dbAuthToken?.value && dbPhoneNumber?.value) {
    return {
      accountSid: dbAccountSid.value,
      authToken: dbAuthToken.value,
      phoneNumber: dbPhoneNumber.value,
      source: 'database' as const
    };
  }

  // Fall back to environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error('Twilio credentials not configured. Please set credentials in admin settings or set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in Secrets.');
  }

  return {
    accountSid,
    authToken,
    phoneNumber,
    source: 'environment' as const
  };
}

export async function getTwilioClient() {
  const { accountSid, authToken } = await getCredentials();
  console.log('[TWILIO] Initializing client with Account SID:', accountSid?.substring(0, 10) + '...');
  console.log('[TWILIO] Auth Token length:', authToken?.length, 'chars');
  return twilio(accountSid, authToken);
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function getTwilioConnectionStatus() {
  try {
    const { accountSid, phoneNumber } = await getCredentials();
    return {
      connected: true,
      accountSid,
      phoneNumber
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function isTwilioEnabled(): Promise<boolean> {
  try {
    const enabledSetting = await storage.getSetting('TWILIO_ENABLED');
    // If not set, default to true (enabled)
    return enabledSetting?.value !== 'false';
  } catch (error) {
    console.error('Error checking Twilio enabled status:', error);
    return true; // Default to enabled on error
  }
}
