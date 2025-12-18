export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSProvider {
  name: string;
  sendSMS(to: string, message: string): Promise<SMSResult>;
  testConnection(): Promise<{ connected: boolean; error?: string }>;
  isConfigured(): Promise<boolean>;
}

export type SMSGatewayType = 'twilio' | 'amazon-sns' | 'plivo';

export interface SMSGatewayConfig {
  activeGateway: SMSGatewayType;
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  amazonSns: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    senderId?: string;
  };
  plivo: {
    authId: string;
    authToken: string;
    phoneNumber: string;
  };
}
