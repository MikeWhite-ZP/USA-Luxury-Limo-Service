import twilio from 'twilio';

function getCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in Secrets.');
  }

  return {
    accountSid,
    authToken,
    phoneNumber
  };
}

export function getTwilioClient() {
  const { accountSid, authToken } = getCredentials();
  console.log('[TWILIO] Initializing client with Account SID:', accountSid?.substring(0, 10) + '...');
  console.log('[TWILIO] Auth Token length:', authToken?.length, 'chars');
  return twilio(accountSid, authToken);
}

export function getTwilioFromPhoneNumber() {
  const { phoneNumber } = getCredentials();
  return phoneNumber;
}

export function getTwilioConnectionStatus() {
  try {
    const { accountSid, phoneNumber } = getCredentials();
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
