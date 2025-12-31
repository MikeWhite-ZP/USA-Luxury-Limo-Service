import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { randomBytes, createHash } from 'crypto';

const router = Router();

function generateApiToken(): string {
  return randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

router.post('/register', async (req: Request, res: Response) => {
  console.log(`[ANDROID_SMS] Registration request received from ${req.ip}:`, JSON.stringify(req.body));
  try {
    const { deviceUuid, deviceName, phoneNumber, metadata } = req.body;

    if (!deviceUuid) {
      console.log('[ANDROID_SMS] Registration failed: Missing device UUID');
      return res.status(400).json({ error: 'Device UUID is required' });
    }

    const existingDevice = await storage.getAndroidSmsDevice(deviceUuid);
    
    if (existingDevice) {
      const newToken = generateApiToken();
      const hashedToken = hashToken(newToken);
      const updatedDevice = await storage.updateAndroidSmsDevice(deviceUuid, {
        deviceName,
        phoneNumber,
        metadata,
        apiToken: hashedToken,
        isActive: true,
        lastHeartbeat: new Date()
      });
      
      console.log(`[ANDROID_SMS] Device re-registered: ${deviceUuid} (token invalidated and regenerated)`);
      return res.json({
        success: true,
        deviceId: updatedDevice?.id,
        apiToken: newToken,
        message: 'Device re-registered successfully. Previous tokens are now invalid.'
      });
    }

    const apiToken = generateApiToken();
    const hashedToken = hashToken(apiToken);
    const device = await storage.createAndroidSmsDevice({
      deviceUuid,
      deviceName: deviceName || `Android Device ${deviceUuid.substring(0, 8)}`,
      apiToken: hashedToken,
      phoneNumber,
      metadata,
      isActive: true,
      lastHeartbeat: new Date()
    });

    console.log(`[ANDROID_SMS] New device registered: ${deviceUuid}`);
    
    res.status(201).json({
      success: true,
      deviceId: device.id,
      apiToken,
      message: 'Device registered successfully'
    });
  } catch (error) {
    console.error('[ANDROID_SMS] Device registration error:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

async function authenticateDevice(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  const deviceUuid = req.headers['x-device-uuid'] as string;

  if (!authHeader || !deviceUuid) {
    return res.status(401).json({ error: 'Missing authentication credentials' });
  }

  const token = authHeader.replace('Bearer ', '');
  const hashedToken = hashToken(token);
  
  try {
    const device = await storage.getAndroidSmsDevice(deviceUuid);
    
    if (!device || device.apiToken !== hashedToken) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!device.isActive) {
      return res.status(403).json({ error: 'Device is deactivated' });
    }

    (req as any).device = device;
    next();
  } catch (error) {
    console.error('[ANDROID_SMS] Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

router.post('/heartbeat', authenticateDevice, async (req: Request, res: Response) => {
  try {
    const device = (req as any).device;
    
    await storage.updateAndroidSmsDevice(device.deviceUuid, {
      lastHeartbeat: new Date()
    });

    const pendingCount = await storage.getPendingAndroidSmsCount();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      pendingMessages: pendingCount
    });
  } catch (error) {
    console.error('[ANDROID_SMS] Heartbeat error:', error);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

router.get('/messages/pending', authenticateDevice, async (req: Request, res: Response) => {
  try {
    const device = (req as any).device;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const messages = await storage.claimPendingAndroidSms(device.deviceUuid, limit);

    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        phoneNumber: msg.phoneNumber,
        message: msg.message,
        priority: msg.priority,
        createdAt: msg.createdAt
      })),
      count: messages.length
    });
  } catch (error) {
    console.error('[ANDROID_SMS] Fetch pending messages error:', error);
    res.status(500).json({ error: 'Failed to fetch pending messages' });
  }
});

router.post('/messages/:messageId/status', authenticateDevice, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { status, errorMessage } = req.body;
    const device = (req as any).device;

    if (!['SENT', 'FAILED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be SENT or FAILED' });
    }

    const message = await storage.getAndroidSmsQueueItem(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.deviceUuid !== device.deviceUuid) {
      return res.status(403).json({ error: 'Message not claimed by this device' });
    }

    await storage.updateAndroidSmsStatus(messageId, {
      status,
      errorMessage: status === 'FAILED' ? errorMessage : null,
      sentAt: status === 'SENT' ? new Date() : null
    });

    console.log(`[ANDROID_SMS] Message ${messageId} status updated to ${status}`);

    res.json({
      success: true,
      messageId,
      status
    });
  } catch (error) {
    console.error('[ANDROID_SMS] Status update error:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

router.post('/messages/:messageId/retry', authenticateDevice, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const device = (req as any).device;

    const message = await storage.getAndroidSmsQueueItem(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.deviceUuid !== device.deviceUuid) {
      return res.status(403).json({ error: 'Message not claimed by this device' });
    }

    if (message.retryCount !== null && message.maxRetries !== null && 
        message.retryCount >= message.maxRetries) {
      return res.status(400).json({ error: 'Maximum retries exceeded' });
    }

    await storage.retryAndroidSms(messageId);

    console.log(`[ANDROID_SMS] Message ${messageId} marked for retry`);

    res.json({
      success: true,
      messageId,
      message: 'Message marked for retry'
    });
  } catch (error) {
    console.error('[ANDROID_SMS] Retry error:', error);
    res.status(500).json({ error: 'Failed to retry message' });
  }
});

export default router;
