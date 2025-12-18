import { storage } from '../storage';
import { SMSProvider, SMSResult, SMSGatewayType } from './types';
import { twilioProvider } from './twilio-provider';
import { amazonSnsProvider } from './amazon-sns-provider';
import { plivoProvider } from './plivo-provider';

const providers: Record<SMSGatewayType, SMSProvider> = {
  'twilio': twilioProvider,
  'amazon-sns': amazonSnsProvider,
  'plivo': plivoProvider
};

export async function getActiveGateway(): Promise<SMSGatewayType> {
  try {
    const setting = await storage.getSetting('SMS_GATEWAY');
    if (setting?.value && (setting.value === 'twilio' || setting.value === 'amazon-sns' || setting.value === 'plivo')) {
      return setting.value as SMSGatewayType;
    }
  } catch (error) {
    console.error('Error getting active SMS gateway:', error);
  }
  return 'twilio';
}

export async function setActiveGateway(gateway: SMSGatewayType, userId: string = 'system'): Promise<void> {
  await storage.setSetting('SMS_GATEWAY', gateway, userId);
}

export async function getActiveProvider(): Promise<SMSProvider> {
  const gateway = await getActiveGateway();
  return providers[gateway];
}

export async function isSMSEnabled(): Promise<boolean> {
  try {
    const enabledSetting = await storage.getSetting('SMS_ENABLED');
    return enabledSetting?.value !== 'false';
  } catch (error) {
    console.error('Error checking SMS enabled status:', error);
    return true;
  }
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  try {
    const enabled = await isSMSEnabled();
    if (!enabled) {
      console.log('SMS sending skipped: SMS is disabled in admin settings');
      return {
        success: false,
        error: 'SMS notifications are disabled'
      };
    }

    const provider = await getActiveProvider();
    const isConfigured = await provider.isConfigured();
    
    if (!isConfigured) {
      console.log(`SMS sending skipped: ${provider.name} is not configured`);
      return {
        success: false,
        error: `${provider.name} is not configured`
      };
    }

    return await provider.sendSMS(to, message);
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function testSMSConnection(gateway?: SMSGatewayType): Promise<{ connected: boolean; error?: string }> {
  const gatewayType = gateway || await getActiveGateway();
  const provider = providers[gatewayType];
  return await provider.testConnection();
}

export async function getGatewayStatus(): Promise<{
  activeGateway: SMSGatewayType;
  smsEnabled: boolean;
  providers: {
    twilio: { configured: boolean; name: string };
    amazonSns: { configured: boolean; name: string };
    plivo: { configured: boolean; name: string };
  };
}> {
  const [activeGateway, smsEnabled, twilioConfigured, snsConfigured, plivoConfigured] = await Promise.all([
    getActiveGateway(),
    isSMSEnabled(),
    twilioProvider.isConfigured(),
    amazonSnsProvider.isConfigured(),
    plivoProvider.isConfigured()
  ]);

  return {
    activeGateway,
    smsEnabled,
    providers: {
      twilio: { configured: twilioConfigured, name: 'Twilio' },
      amazonSns: { configured: snsConfigured, name: 'Amazon SNS' },
      plivo: { configured: plivoConfigured, name: 'Plivo' }
    }
  };
}

export { SMSResult, SMSGatewayType } from './types';
export { twilioProvider } from './twilio-provider';
export { amazonSnsProvider } from './amazon-sns-provider';
export { plivoProvider } from './plivo-provider';
