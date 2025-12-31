import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { getCurrentSmsProviderType, setSmsProvider } from '../smsProvider';
import type { SmsProviderType } from '../smsProvider';

const router = Router();

router.get('/provider', async (req: Request, res: Response) => {
  try {
    const currentProvider = await getCurrentSmsProviderType();
    
    res.json({
      success: true,
      provider: currentProvider
    });
  } catch (error) {
    console.error('[ADMIN_SMS] Error getting provider:', error);
    res.status(500).json({ error: 'Failed to get SMS provider' });
  }
});

router.post('/provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;
    const user = req.user as any;
    
    if (!user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!provider || !['TWILIO', 'ANDROID_SMS'].includes(provider)) {
      return res.status(400).json({ 
        error: 'Invalid provider. Must be TWILIO or ANDROID_SMS' 
      });
    }

    if (provider === 'ANDROID_SMS') {
      const devices = await storage.getActiveAndroidSmsDevices();
      if (devices.length === 0) {
        return res.status(400).json({ 
          error: 'Cannot switch to Android SMS: No active devices registered' 
        });
      }
    }

    await setSmsProvider(provider as SmsProviderType, user.id);

    console.log(`[ADMIN_SMS] Provider changed to: ${provider}`);

    res.json({
      success: true,
      provider,
      message: `SMS provider changed to ${provider}`
    });
  } catch (error) {
    console.error('[ADMIN_SMS] Error setting provider:', error);
    res.status(500).json({ error: 'Failed to set SMS provider' });
  }
});

router.get('/devices', async (req: Request, res: Response) => {
  try {
    const devices = await storage.getAllAndroidSmsDevices();
    
    res.json({
      success: true,
      devices: devices.map(device => ({
        id: device.id,
        deviceUuid: device.deviceUuid,
        deviceName: device.deviceName,
        phoneNumber: device.phoneNumber,
        isActive: device.isActive,
        lastHeartbeat: device.lastHeartbeat,
        createdAt: device.createdAt
      }))
    });
  } catch (error) {
    console.error('[ADMIN_SMS] Error getting devices:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

router.post('/devices/:deviceUuid/toggle', async (req: Request, res: Response) => {
  try {
    const { deviceUuid } = req.params;
    const { isActive } = req.body;

    const device = await storage.getAndroidSmsDevice(deviceUuid);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    await storage.updateAndroidSmsDevice(deviceUuid, { isActive });

    console.log(`[ADMIN_SMS] Device ${deviceUuid} ${isActive ? 'activated' : 'deactivated'}`);

    res.json({
      success: true,
      deviceUuid,
      isActive,
      message: `Device ${isActive ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    console.error('[ADMIN_SMS] Error toggling device:', error);
    res.status(500).json({ error: 'Failed to toggle device status' });
  }
});

router.delete('/devices/:deviceUuid', async (req: Request, res: Response) => {
  try {
    const { deviceUuid } = req.params;

    const device = await storage.getAndroidSmsDevice(deviceUuid);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    await storage.deleteAndroidSmsDevice(deviceUuid);

    console.log(`[ADMIN_SMS] Device ${deviceUuid} deleted`);

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('[ADMIN_SMS] Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

router.get('/queue/stats', async (req: Request, res: Response) => {
  try {
    const stats = await storage.getAndroidSmsQueueStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[ADMIN_SMS] Error getting queue stats:', error);
    res.status(500).json({ error: 'Failed to get queue stats' });
  }
});

router.get('/queue', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const status = req.query.status as string;

    const messages = await storage.getAndroidSmsQueue({ limit, status });
    
    res.json({
      success: true,
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('[ADMIN_SMS] Error getting queue:', error);
    res.status(500).json({ error: 'Failed to get queue' });
  }
});

router.delete('/queue/:messageId', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    await storage.deleteAndroidSmsQueueItem(messageId);

    res.json({
      success: true,
      message: 'Message deleted from queue'
    });
  } catch (error) {
    console.error('[ADMIN_SMS] Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

router.post('/queue/clear-failed', async (req: Request, res: Response) => {
  try {
    const count = await storage.clearFailedAndroidSms();

    res.json({
      success: true,
      clearedCount: count,
      message: `Cleared ${count} failed messages`
    });
  } catch (error) {
    console.error('[ADMIN_SMS] Error clearing failed messages:', error);
    res.status(500).json({ error: 'Failed to clear failed messages' });
  }
});

export default router;
