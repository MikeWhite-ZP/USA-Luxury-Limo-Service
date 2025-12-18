import { SNSClient, PublishCommand, GetSMSAttributesCommand } from '@aws-sdk/client-sns';
import { storage } from '../storage';
import { SMSProvider, SMSResult } from './types';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

async function getCredentials() {
  const dbAccessKeyId = await storage.getSetting('AWS_SNS_ACCESS_KEY_ID');
  const dbSecretAccessKey = await storage.getSetting('AWS_SNS_SECRET_ACCESS_KEY');
  const dbRegion = await storage.getSetting('AWS_SNS_REGION');
  const dbSenderId = await storage.getSetting('AWS_SNS_SENDER_ID');

  if (dbAccessKeyId?.value && dbSecretAccessKey?.value && dbRegion?.value) {
    return {
      accessKeyId: dbAccessKeyId.value,
      secretAccessKey: dbSecretAccessKey.value,
      region: dbRegion.value,
      senderId: dbSenderId?.value || undefined,
      source: 'database' as const
    };
  }

  const accessKeyId = process.env.AWS_SNS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SNS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_SNS_REGION || 'us-east-1';
  const senderId = process.env.AWS_SNS_SENDER_ID;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Amazon SNS credentials not configured');
  }

  return {
    accessKeyId,
    secretAccessKey,
    region,
    senderId,
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

export class AmazonSNSProvider implements SMSProvider {
  name = 'Amazon SNS';

  private async getClient(): Promise<SNSClient> {
    const { accessKeyId, secretAccessKey, region } = await getCredentials();
    return new SNSClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
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
      const { senderId } = await getCredentials();

      const params: any = {
        Message: message,
        PhoneNumber: normalizedPhone,
      };

      if (senderId) {
        params.MessageAttributes = {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: senderId
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        };
      }

      const command = new PublishCommand(params);
      const result = await client.send(command);

      console.log(`[Amazon SNS] SMS sent successfully to ${normalizedPhone}, MessageId: ${result.MessageId}`);
      
      return {
        success: true,
        messageId: result.MessageId
      };
    } catch (error) {
      console.error('[Amazon SNS] Failed to send SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const client = await this.getClient();
      const command = new GetSMSAttributesCommand({});
      await client.send(command);
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

export const amazonSnsProvider = new AmazonSNSProvider();
