import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, CheckCircle, XCircle, Loader2, Eye, EyeOff, Save, Settings, AlertCircle, Check } from 'lucide-react';

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
      
      // Always populate credentials from status response (even if not connected)
      setCredentials(prev => ({
        ...prev,
        accountSid: data.accountSid || '',
        phoneNumber: data.phoneNumber || '',
        enabled: data.enabled !== undefined ? data.enabled : true,
        // Keep authToken empty - we'll use status.hasAuthToken to display the masked version
        authToken: '',
      }));
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
    <Card id="settings-section" data-testid="sms-settings" className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50/30 border-b border-slate-200">
        <CardTitle className="flex items-center gap-3 text-slate-900">
          <div className="bg-purple-600 p-2 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span>SMS Notifications (Twilio)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-purple-100 p-1.5 rounded-lg">
                  <Settings className="w-4 h-4 text-purple-700" />
                </div>
                <h3 className="font-semibold text-slate-900">SMS Notifications Control</h3>
              </div>
              <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-slate-200">
                <div>
                  <h4 className="font-semibold text-slate-900">SMS Notifications</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {credentials.enabled ? 'SMS notifications are active' : 'SMS notifications are disabled'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${credentials.enabled ? 'text-green-600' : 'text-slate-400'}`}>
                    {credentials.enabled ? 'ON' : 'OFF'}
                  </span>
                  <Switch
                    checked={credentials.enabled}
                    onCheckedChange={handleToggleEnabled}
                    data-testid="switch-sms-enabled"
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-blue-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Connection Status</h3>
                </div>
                {status?.connected ? (
                  <Badge className="bg-green-600 text-white border-green-700" data-testid="badge-sms-connected">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-200" data-testid="badge-sms-disconnected">
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
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                data-testid="button-refresh-status"
              >
                <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>

            {/* Twilio Credentials */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-100 p-1.5 rounded-lg">
                    <Settings className="w-4 h-4 text-indigo-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Twilio Credentials</h3>
                </div>
                {!editing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    data-testid="button-edit-credentials"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Credentials
                  </Button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
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
                    <Label htmlFor="auth-token">
                      Auth Token
                      {status?.hasAuthToken && (
                        <span className="text-xs text-muted-foreground ml-2">(optional - leave empty to keep existing)</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Input
                        id="auth-token"
                        type={showAuthToken ? "text" : "password"}
                        placeholder={status?.hasAuthToken ? "Leave empty to keep existing token" : "Your Twilio Auth Token"}
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

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSaveCredentials}
                      disabled={saving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
                      className="border-slate-300"
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">Account SID:</span>
                    <span className="font-mono text-xs text-slate-900" data-testid="text-account-sid">
                      {credentials.accountSid ? `${credentials.accountSid.substring(0, 12)}...` : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">Auth Token:</span>
                    <span className="font-mono text-xs text-slate-900" data-testid="text-auth-token">
                      {status?.hasAuthToken ? '••••••••••••••••' : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">Phone Number:</span>
                    <span className="font-mono text-xs text-slate-900" data-testid="text-phone-number">
                      {credentials.phoneNumber || 'Not configured'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Test SMS */}
            {credentials.enabled && status?.connected && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-green-100 p-1.5 rounded-lg">
                    <Send className="w-4 h-4 text-green-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Test SMS Notification</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Send a test SMS to verify your Twilio configuration is working correctly.
                </p>

                <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                  <div className="space-y-2">
                    <Label htmlFor="test-phone" className="text-slate-900">Phone Number</Label>
                    <Input
                      id="test-phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                      data-testid="input-test-phone"
                    />
                    <p className="text-xs text-slate-600">
                      Include country code (e.g., +1 for US)
                    </p>
                  </div>

                  <Button
                    onClick={handleTestSMS}
                    disabled={sendingTest || !testPhoneNumber}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
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
              </div>
            )}

            {/* SMS Notification Settings Info */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-amber-100 p-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                </div>
                <h3 className="font-semibold text-slate-900">Automated SMS Notifications</h3>
              </div>
              <p className="text-sm text-slate-700 mb-3">
                When enabled, SMS notifications will be automatically sent for:
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-amber-200">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Booking confirmations to passengers</span>
                </div>
                <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-amber-200">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Booking status updates (confirmed, in progress, completed)</span>
                </div>
                <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-amber-200">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Driver assignments to drivers</span>
                </div>
              </div>
              <div className="bg-white border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-slate-600">
                  <strong className="text-amber-700">Note:</strong> SMS notifications will only be sent if SMS is enabled and the user has a valid phone number on file.
                </p>
              </div>
            </div>

            {/* Configuration Guide */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-300 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-100 p-1.5 rounded-lg">
                  <Settings className="w-4 h-4 text-blue-700" />
                </div>
                <h3 className="font-semibold text-slate-900">Setup Instructions</h3>
              </div>
              <ol className="space-y-2">
                <li className="flex gap-3 items-start">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0 mt-0.5">1</span>
                  <span className="text-sm text-slate-700">Sign up for a Twilio account at twilio.com</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0 mt-0.5">2</span>
                  <span className="text-sm text-slate-700">Get your Account SID and Auth Token from the Twilio Console</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0 mt-0.5">3</span>
                  <span className="text-sm text-slate-700">Purchase a phone number in the Twilio Console</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0 mt-0.5">4</span>
                  <span className="text-sm text-slate-700">Enter your credentials above and click "Save Credentials"</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0 mt-0.5">5</span>
                  <span className="text-sm text-slate-700">Enable SMS notifications using the toggle switch</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex-shrink-0 mt-0.5">6</span>
                  <span className="text-sm text-slate-700">Send a test SMS to verify everything is working</span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
