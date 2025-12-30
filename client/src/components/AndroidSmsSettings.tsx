import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Signal,
  Clock,
  MessageSquare,
  Settings
} from 'lucide-react';

interface AndroidDevice {
  id: string;
  deviceUuid: string;
  deviceName: string;
  phoneNumber: string | null;
  isActive: boolean;
  lastHeartbeat: string | null;
  createdAt: string;
}

interface QueueStats {
  pending: number;
  sent: number;
  failed: number;
  total: number;
}

export function AndroidSmsSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<AndroidDevice[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [currentProvider, setCurrentProvider] = useState<'TWILIO' | 'ANDROID_SMS'>('TWILIO');
  const [switchingProvider, setSwitchingProvider] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devicesRes, statsRes, providerRes] = await Promise.all([
        fetch('/api/admin/android-sms/devices'),
        fetch('/api/admin/android-sms/queue/stats'),
        fetch('/api/admin/android-sms/provider')
      ]);

      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data.devices || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setQueueStats(data.stats || null);
      }

      if (providerRes.ok) {
        const data = await providerRes.json();
        setCurrentProvider(data.provider || 'TWILIO');
      }
    } catch (error) {
      console.error('Failed to fetch Android SMS data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProviderChange = async (useAndroid: boolean) => {
    const newProvider = useAndroid ? 'ANDROID_SMS' : 'TWILIO';
    
    if (newProvider === 'ANDROID_SMS') {
      const activeDevices = devices.filter(d => d.isActive);
      if (activeDevices.length === 0) {
        toast({
          title: 'No Active Devices',
          description: 'Please register and activate at least one Android device first.',
          variant: 'destructive',
        });
        return;
      }
    }

    setSwitchingProvider(true);
    try {
      const response = await fetch('/api/admin/android-sms/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: newProvider }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to switch provider');
      }

      setCurrentProvider(newProvider);
      toast({
        title: 'Provider Changed',
        description: `SMS provider switched to ${newProvider === 'ANDROID_SMS' ? 'Android Phone' : 'Twilio'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Switch Provider',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSwitchingProvider(false);
    }
  };

  const handleToggleDevice = async (deviceUuid: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/android-sms/devices/${deviceUuid}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error('Failed to toggle device');

      setDevices(prev => 
        prev.map(d => d.deviceUuid === deviceUuid ? { ...d, isActive } : d)
      );

      toast({
        title: isActive ? 'Device Activated' : 'Device Deactivated',
        description: `Device has been ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      toast({
        title: 'Failed to Toggle Device',
        description: 'Could not update device status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDevice = async (deviceUuid: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      const response = await fetch(`/api/admin/android-sms/devices/${deviceUuid}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete device');

      setDevices(prev => prev.filter(d => d.deviceUuid !== deviceUuid));

      toast({
        title: 'Device Deleted',
        description: 'Device has been removed from the system',
      });
    } catch (error) {
      toast({
        title: 'Failed to Delete Device',
        description: 'Could not delete device',
        variant: 'destructive',
      });
    }
  };

  const handleClearFailed = async () => {
    try {
      const response = await fetch('/api/admin/android-sms/queue/clear-failed', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to clear failed messages');

      const data = await response.json();
      await fetchData();

      toast({
        title: 'Failed Messages Cleared',
        description: `Cleared ${data.clearedCount} failed messages`,
      });
    } catch (error) {
      toast({
        title: 'Failed to Clear Messages',
        description: 'Could not clear failed messages',
        variant: 'destructive',
      });
    }
  };

  const getHeartbeatStatus = (lastHeartbeat: string | null) => {
    if (!lastHeartbeat) return { status: 'offline', color: 'bg-gray-500' };
    
    const diff = Date.now() - new Date(lastHeartbeat).getTime();
    const minutes = diff / 60000;
    
    if (minutes < 2) return { status: 'online', color: 'bg-green-500' };
    if (minutes < 10) return { status: 'idle', color: 'bg-yellow-500' };
    return { status: 'offline', color: 'bg-red-500' };
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-muted/30 to-card">
      <CardHeader className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 border-b-0 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
        <CardTitle className="relative flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-green-200/30 rounded-2xl blur-md opacity-60" />
            <div className="relative bg-white/20 backdrop-blur-sm p-3.5 rounded-2xl border border-white/30 shadow-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Android SMS Gateway</h2>
            <p className="text-sm text-green-100 mt-0.5 font-light">Manage Android devices for native SMS sending</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="bg-card rounded-2xl border-2 border-border shadow-md p-8">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-border">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-2.5 rounded-xl">
              <Settings className="w-5 h-5 text-purple-700 dark:text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-foreground">SMS Provider Selection</h3>
          </div>
          
          <div className="flex items-center justify-between bg-gradient-to-r from-muted to-green-50/30 dark:to-green-900/30 rounded-xl p-6 border-2 border-border">
            <div>
              <h4 className="font-bold text-foreground text-lg mb-1">Use Android Phone for SMS</h4>
              <p className="text-sm text-muted-foreground font-medium">
                {currentProvider === 'ANDROID_SMS' 
                  ? 'SMS will be sent through registered Android devices' 
                  : 'SMS is currently sent through Twilio'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={`px-4 py-2 text-sm font-bold ${currentProvider === 'ANDROID_SMS' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                {currentProvider === 'ANDROID_SMS' ? 'Android' : 'Twilio'}
              </Badge>
              <Switch
                checked={currentProvider === 'ANDROID_SMS'}
                onCheckedChange={(checked) => handleProviderChange(checked)}
                disabled={switchingProvider}
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border-2 border-border shadow-md p-8">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 p-2.5 rounded-xl">
                <Smartphone className="w-5 h-5 text-blue-700 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Registered Devices ({devices.length})</h3>
            </div>
            <Button
              onClick={fetchData}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {devices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No Android devices registered</p>
              <p className="text-sm mt-2">Install the Android SMS Gateway app to register devices</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => {
                const heartbeat = getHeartbeatStatus(device.lastHeartbeat);
                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between bg-gradient-to-r from-muted to-blue-50/20 dark:to-blue-900/20 rounded-xl p-5 border-2 border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Smartphone className="w-10 h-10 text-blue-600" />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${heartbeat.color} border-2 border-white`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{device.deviceName}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {device.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <Signal className="w-3 h-3" />
                              {device.phoneNumber}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {device.lastHeartbeat 
                              ? new Date(device.lastHeartbeat).toLocaleString()
                              : 'Never connected'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={device.isActive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }>
                        {device.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Switch
                        checked={device.isActive}
                        onCheckedChange={(checked) => handleToggleDevice(device.deviceUuid, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDevice(device.deviceUuid)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {queueStats && (
          <div className="bg-card rounded-2xl border-2 border-border shadow-md p-8">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 p-2.5 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                </div>
                <h3 className="text-xl font-bold text-foreground">SMS Queue Statistics</h3>
              </div>
              {queueStats.failed > 0 && (
                <Button
                  onClick={handleClearFailed}
                  variant="outline"
                  className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Failed ({queueStats.failed})
                </Button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{queueStats.total}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/50 dark:to-yellow-800/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{queueStats.pending}</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Pending</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{queueStats.sent}</p>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Sent</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/50 dark:to-red-800/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">{queueStats.failed}</p>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Failed</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
