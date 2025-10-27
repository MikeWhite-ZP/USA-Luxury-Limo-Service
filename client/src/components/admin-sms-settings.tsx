import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, CheckCircle, XCircle, Loader2, Eye, EyeOff, Save } from 'lucide-react';

interface TwilioStatus {
  connected: boolean;
  enabled: boolean;
  accountSid?: string;
  phoneNumber?: string;
  hasAuthToken?: boolean;
  error?: string;
}

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  enabled: boolean;
}

export function AdminSMSSettings() {
  const { toast } = useToast();
  const [status, setStatus] = useState<TwilioStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAuthToken, setShowAuthToken] = useState(false);
  
  const [credentials, setCredentials] = useState<TwilioCredentials>({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    enabled: false,
  });

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sms/status');
      const data = await response.json();
      setStatus(data);
      
      // Populate credentials from status if available
      if (data.connected || data.accountSid || data.phoneNumber) {
        setCredentials(prev => ({
          ...prev,
          accountSid: data.accountSid || '',
          phoneNumber: data.phoneNumber || '',
          enabled: data.enabled !== undefined ? data.enabled : true,
          // Keep authToken empty - we'll use status.hasAuthToken to display the masked version
          authToken: '',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch SMS status:', error);
      setStatus({ connected: false, enabled: false, error: 'Failed to check status' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSaveCredentials = async () => {
    // Validate required fields
    if (!credentials.accountSid || !credentials.phoneNumber) {
      toast({
        title: 'Incomplete Credentials',
        description: 'Please fill in Account SID and Phone Number',
        variant: 'destructive',
      });
      return;
    }

    // Auth token is required only for new setups (when no token exists in database)
    if (!status?.hasAuthToken && !credentials.authToken) {
      toast({
        title: 'Auth Token Required',
        description: 'Please enter your Twilio Auth Token for initial setup',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Build request body - only include authToken if user entered a new value
      const requestBody: any = {
        accountSid: credentials.accountSid,
        phoneNumber: credentials.phoneNumber,
        enabled: credentials.enabled,
      };
      
      // Only send authToken if user typed a new value
      if (credentials.authToken) {
        requestBody.authToken = credentials.authToken;
      }

      const response = await fetch('/api/admin/sms/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to save credentials');
      }

      toast({
        title: 'Credentials Saved',
        description: 'Twilio credentials have been updated successfully',
      });
      
      setEditing(false);
      setShowAuthToken(false);
      await checkStatus();
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save Twilio credentials',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/sms/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle SMS status');
      }

      toast({
        title: enabled ? 'SMS Enabled' : 'SMS Disabled',
        description: enabled 
          ? 'SMS notifications are now active' 
          : 'SMS notifications have been disabled',
      });
      
      setCredentials(prev => ({ ...prev, enabled }));
      await checkStatus();
    } catch (error: any) {
      toast({
        title: 'Toggle Failed',
        description: error.message || 'Failed to toggle SMS status',
        variant: 'destructive',
      });
    }
  };

  const handleTestSMS = async () => {
    if (!testPhoneNumber) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter a phone number to send test SMS',
        variant: 'destructive',
      });
      return;
    }

    setSendingTest(true);
    try {
      const response = await fetch('/api/admin/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: testPhoneNumber }),
      });

      const result = await response.json() as { success: boolean; message: string; messageId?: string };

      if (result.success) {
        toast({
          title: 'Test SMS Sent',
          description: result.message,
        });
        setTestPhoneNumber('');
      } else {
        toast({
          title: 'Test Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to send test SMS',
        variant: 'destructive',
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <Card id="settings-section" data-testid="sms-settings">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>SMS Notifications (Twilio)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Enable/Disable Toggle */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">SMS Notifications</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {credentials.enabled ? 'SMS notifications are active' : 'SMS notifications are disabled'}
                  </p>
                </div>
                <Switch
                  checked={credentials.enabled}
                  onCheckedChange={handleToggleEnabled}
                  data-testid="switch-sms-enabled"
                />
              </div>
            </div>

            {/* Connection Status */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Connection Status</h4>
                {status?.connected ? (
                  <Badge className="bg-green-600" data-testid="badge-sms-connected">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive" data-testid="badge-sms-disconnected">
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={checkStatus}
                disabled={loading}
                data-testid="button-refresh-status"
              >
                <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>

            {/* Twilio Credentials */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Twilio Credentials</h4>
                {!editing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                    data-testid="button-edit-credentials"
                  >
                    Edit Credentials
                  </Button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-sid">Account SID</Label>
                    <Input
                      id="account-sid"
                      type="text"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={credentials.accountSid}
                      onChange={(e) => setCredentials(prev => ({ ...prev, accountSid: e.target.value }))}
                      data-testid="input-account-sid"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auth-token">Auth Token</Label>
                    <div className="relative">
                      <Input
                        id="auth-token"
                        type={showAuthToken ? "text" : "password"}
                        placeholder="Your Twilio Auth Token"
                        value={credentials.authToken}
                        onChange={(e) => setCredentials(prev => ({ ...prev, authToken: e.target.value }))}
                        data-testid="input-auth-token"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthToken(!showAuthToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        data-testid="button-toggle-auth-token"
                      >
                        {showAuthToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="+1234567890"
                      value={credentials.phoneNumber}
                      onChange={(e) => setCredentials(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      data-testid="input-twilio-phone"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your Twilio phone number (include country code)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveCredentials}
                      disabled={saving}
                      data-testid="button-save-credentials"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Credentials
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setShowAuthToken(false);
                        checkStatus();
                      }}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Account SID:</span>
                    <span className="font-mono text-xs" data-testid="text-account-sid">
                      {credentials.accountSid ? `${credentials.accountSid.substring(0, 12)}...` : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Auth Token:</span>
                    <span className="font-mono text-xs" data-testid="text-auth-token">
                      {status?.hasAuthToken ? '••••••••••••••••' : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone Number:</span>
                    <span className="font-mono text-xs" data-testid="text-phone-number">
                      {credentials.phoneNumber || 'Not configured'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Test SMS */}
            {credentials.enabled && status?.connected && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Test SMS Notification</h4>
                <p className="text-sm text-muted-foreground">
                  Send a test SMS to verify your Twilio configuration is working correctly.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="test-phone">Phone Number</Label>
                  <Input
                    id="test-phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    data-testid="input-test-phone"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>

                <Button
                  onClick={handleTestSMS}
                  disabled={sendingTest || !testPhoneNumber}
                  data-testid="button-send-test-sms"
                >
                  {sendingTest ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Test SMS
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* SMS Notification Settings Info */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
              <h4 className="font-semibold text-sm">Automated SMS Notifications</h4>
              <p className="text-sm text-muted-foreground">
                When enabled, SMS notifications will be automatically sent for:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Booking confirmations to passengers</li>
                <li>• Booking status updates (confirmed, in progress, completed)</li>
                <li>• Driver assignments to drivers</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Note:</strong> SMS notifications will only be sent if SMS is enabled and the user has a valid phone number on file.
              </p>
            </div>

            {/* Configuration Guide */}
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg space-y-2">
              <strong>Setup Instructions:</strong>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Sign up for a Twilio account at twilio.com</li>
                <li>Get your Account SID and Auth Token from the Twilio Console</li>
                <li>Purchase a phone number in the Twilio Console</li>
                <li>Enter your credentials above and click "Save Credentials"</li>
                <li>Enable SMS notifications using the toggle switch</li>
                <li>Send a test SMS to verify everything is working</li>
              </ol>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
