import { storage } from './storage';

export interface ShortcodeData {
  [key: string]: string | number | Date | undefined | null;
}

export function replaceShortcodes(content: string, data: ShortcodeData): string {
  let result = content;
  
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    let replacement = '';
    
    if (value === undefined || value === null) {
      replacement = '';
    } else if (value instanceof Date) {
      replacement = value.toLocaleString();
    } else {
      replacement = String(value);
    }
    
    result = result.replace(regex, replacement);
  });
  
  return result;
}

export interface EmailTemplateResult {
  subject: string;
  content: string;
  found: boolean;
}

export interface SmsTemplateResult {
  content: string;
  found: boolean;
}

let templateCache: Map<string, { template: any; timestamp: number }> = new Map();
const TEMPLATE_CACHE_DURATION = 60 * 1000;

export async function getEmailTemplate(
  code: string,
  data: ShortcodeData
): Promise<EmailTemplateResult> {
  try {
    const cacheKey = `email_${code}`;
    const now = Date.now();
    const cached = templateCache.get(cacheKey);
    
    let template;
    if (cached && (now - cached.timestamp) < TEMPLATE_CACHE_DURATION) {
      template = cached.template;
    } else {
      template = await storage.getNotificationTemplateByCode(code);
      if (template && template.status === 'active') {
        templateCache.set(cacheKey, { template, timestamp: now });
      }
    }
    
    if (template && template.status === 'active' && template.type === 'email') {
      const subject = replaceShortcodes(template.subject || '', data);
      const content = replaceShortcodes(template.content || '', data);
      
      return {
        subject,
        content,
        found: true
      };
    }
  } catch (error) {
    console.error(`Error fetching email template ${code}:`, error);
  }
  
  return { subject: '', content: '', found: false };
}

export async function getSmsTemplate(
  code: string,
  data: ShortcodeData
): Promise<SmsTemplateResult> {
  try {
    const cacheKey = `sms_${code}`;
    const now = Date.now();
    const cached = templateCache.get(cacheKey);
    
    let template;
    if (cached && (now - cached.timestamp) < TEMPLATE_CACHE_DURATION) {
      template = cached.template;
    } else {
      template = await storage.getNotificationTemplateByCode(code);
      if (template && template.status === 'active') {
        templateCache.set(cacheKey, { template, timestamp: now });
      }
    }
    
    if (template && template.status === 'active' && template.type === 'sms') {
      const content = replaceShortcodes(template.smsContent || '', data);
      
      return {
        content,
        found: true
      };
    }
  } catch (error) {
    console.error(`Error fetching SMS template ${code}:`, error);
  }
  
  return { content: '', found: false };
}

export function clearTemplateCache(): void {
  templateCache.clear();
}
