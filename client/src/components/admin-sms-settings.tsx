import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, CheckCircle, XCircle, Loader2, Eye, EyeOff, Save, Settings, AlertCircle, Check, CheckCircle2, Server, Phone } from 'lucide-react';

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
    <Card id="settings-section" data-testid="sms-settings" className="border-0 shadow-xl bg-gradient-to-br from-white via-slate-50/30 to-white backdrop-blur-sm overflow-hidden">
      {/* Premium Header with layered design */}
      <CardHeader className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 border-b-0 pb-8">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.15)_0%,transparent_50%)]" />
        
        <CardTitle className="relative flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-pink-200/30 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/20 backdrop-blur-sm p-3.5 rounded-2xl border border-white/30 shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">SMS Notifications (Twilio)</h2>
            <p className="text-sm text-purple-100 mt-0.5 font-light">Manage SMS notification settings and Twilio integration</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 bg-gradient-to-b from-white to-slate-50/30">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="relative">
              <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full" />
              <div className="absolute inset-0 animate-ping w-12 h-12 border-4 border-purple-400 rounded-full opacity-20" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-8">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-2.5 rounded-xl">
                  <Settings className="w-5 h-5 text-purple-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">SMS Notifications Control</h3>
              </div>
              <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-purple-50/30 rounded-xl p-6 border-2 border-slate-200 hover:border-purple-300 transition-all duration-300">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg mb-1">SMS Notifications</h4>
                  <p className="text-sm text-slate-600 font-medium">
                    {credentials.enabled ? 'SMS notifications are active' : 'SMS notifications are disabled'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={`px-4 py-2 text-sm font-bold ${credentials.enabled ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {credentials.enabled ? 'ON' : 'OFF'}
                  </Badge>
                  <Switch
                    checked={credentials.enabled}
                    onCheckedChange={handleToggleEnabled}
                    data-testid="switch-sms-enabled"
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600 data-[state=unchecked]:bg-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-2.5 rounded-xl">
                    <Server className="w-5 h-5 text-blue-700" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Connection Status</h3>
                </div>
                {status?.connected ? (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-4 py-2 text-sm font-bold shadow-md" data-testid="badge-sms-connected">
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Connected
                  </Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 px-4 py-2 text-sm font-bold shadow-md" data-testid="badge-sms-disconnected">
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Not Connected
                  </Badge>
                )}
              </div>

              <Button
                onClick={checkStatus}
                disabled={loading}
                className="h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="button-refresh-status"
              >
                <Loader2 className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>

            {/* Twilio Credentials */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-2.5 rounded-xl">
                    <Phone className="w-5 h-5 text-purple-700" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Twilio Credentials</h3>
                </div>
                {!editing && (
                  <Button
                    onClick={() => setEditing(true)}
                    className="h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                    data-testid="button-edit-credentials"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Credentials
                  </Button>
                )}
              </div>

              {editing ? (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="account-sid" className="text-slate-700 font-semibold text-sm">Account SID</Label>
                    <Input
                      id="account-sid"
                      type="text"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={credentials.accountSid}
                      onChange={(e) => setCredentials(prev => ({ ...prev, accountSid: e.target.value }))}
                      className="h-12 border-2 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl text-base"
                      data-testid="input-account-sid"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="auth-token" className="text-slate-700 font-semibold text-sm">
                      Auth Token
                      {status?.hasAuthToken && (
                        <span className="text-xs text-slate-500 ml-2 font-normal">(optional - leave empty to keep existing)</span>
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
                        className="h-12 border-2 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl text-base pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthToken(!showAuthToken)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        data-testid="button-toggle-auth-token"
                      >
                        {showAuthToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="phone-number" className="text-slate-700 font-semibold text-sm">Phone Number</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="+1234567890"
                      value={credentials.phoneNumber}
                      onChange={(e) => setCredentials(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="h-12 border-2 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl text-base"
                      data-testid="input-twilio-phone"
                    />
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Your Twilio phone number (include country code)</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      onClick={handleSaveCredentials}
                      disabled={saving}
                      className="h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      data-testid="button-save-credentials"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Save Credentials
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditing(false);
                        setShowAuthToken(false);
                        checkStatus();
                      }}
                      className="h-12 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 font-bold rounded-xl transition-all"
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="group flex items-center justify-between bg-gradient-to-r from-slate-50 to-purple-50/20 rounded-xl p-5 border-2 border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-bold text-slate-700">Account SID:</span>
                    <span className="font-mono text-sm text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200" data-testid="text-account-sid">
                      {credentials.accountSid ? `${credentials.accountSid.substring(0, 12)}...` : 'Not configured'}
                    </span>
                  </div>
                  <div className="group flex items-center justify-between bg-gradient-to-r from-slate-50 to-purple-50/20 rounded-xl p-5 border-2 border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-bold text-slate-700">Auth Token:</span>
                    <span className="font-mono text-sm text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200" data-testid="text-auth-token">
                      {status?.hasAuthToken ? '••••••••••••••••' : 'Not configured'}
                    </span>
                  </div>
                  <div className="group flex items-center justify-between bg-gradient-to-r from-slate-50 to-purple-50/20 rounded-xl p-5 border-2 border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-bold text-slate-700">Phone Number:</span>
                    <span className="font-mono text-sm text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200" data-testid="text-phone-number">
                      {credentials.phoneNumber || 'Not configured'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Test SMS */}
            {credentials.enabled && status?.connected && (
              <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-8 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-2.5 rounded-xl">
                    <Send className="w-5 h-5 text-green-700" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Test SMS Notification</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Send a test SMS to verify your Twilio configuration is working correctly.
                </p>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="test-phone" className="text-slate-700 font-semibold text-sm">Phone Number</Label>
                    <Input
                      id="test-phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      className="h-12 border-2 border-slate-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl text-base"
                      data-testid="input-test-phone"
                    />
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Include country code (e.g., +1 for US)</span>
                    </p>
                  </div>

                  <Button
                    onClick={handleTestSMS}
                    disabled={sendingTest || !testPhoneNumber}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    data-testid="button-send-test-sms"
                  >
                    {sendingTest ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Test SMS
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* SMS Notification Settings Info */}
            <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl border-2 border-slate-200 shadow-md p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-2.5 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Automated SMS Notifications</h3>
              </div>
              <p className="text-sm text-slate-700 mb-6 leading-relaxed font-medium">
                When enabled, SMS notifications will be automatically sent for:
              </p>
              <div className="grid gap-4 mb-6">
                <div className="group flex items-start gap-4 bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-300">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-2 shadow-sm flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-slate-700 leading-relaxed font-medium">Booking confirmations to passengers</span>
                </div>
                <div className="group flex items-start gap-4 bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-2 shadow-sm flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-slate-700 leading-relaxed font-medium">Booking status updates (confirmed, in progress, completed)</span>
                </div>
                <div className="group flex items-start gap-4 bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-2 shadow-sm flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-slate-700 leading-relaxed font-medium">Driver assignments to drivers</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-amber-700 font-bold">Note:</strong> SMS notifications will only be sent if SMS is enabled and the user has a valid phone number on file.
                </p>
              </div>
            </div>

            {/* Configuration Guide */}
            <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl border-2 border-slate-200 shadow-md p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-2.5 rounded-xl">
                  <Settings className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Setup Instructions</h3>
              </div>
              <ol className="space-y-3">
                <li className="flex gap-4 items-start group">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex-shrink-0 shadow-md">1</span>
                  <span className="text-sm text-slate-700 leading-relaxed font-medium pt-1">Sign up for a Twilio account at twilio.com</span>
                </li>
                <li className="flex gap-4 items-start group">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex-shrink-0 shadow-md">2</span>
                  <span className="text-sm text-slate-700 leading-relaxed font-medium pt-1">Get your Account SID and Auth Token from the Twilio Console</span>
                </li>
                <li className="flex gap-4 items-start group">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex-shrink-0 shadow-md">3</span>
                  <span className="text-sm text-slate-700 leading-relaxed font-medium pt-1">Purchase a phone number in the Twilio Console</span>
                </li>
                <li className="flex gap-4 items-start group">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex-shrink-0 shadow-md">4</span>
                  <span className="text-sm text-slate-700 leading-relaxed font-medium pt-1">Enter your credentials above and click "Save Credentials"</span>
                </li>
                <li className="flex gap-4 items-start group">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex-shrink-0 shadow-md">5</span>
                  <span className="text-sm text-slate-700 leading-relaxed font-medium pt-1">Enable SMS notifications using the toggle switch</span>
                </li>
                <li className="flex gap-4 items-start group">
                  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex-shrink-0 shadow-md">6</span>
                  <span className="text-sm text-slate-700 leading-relaxed font-medium pt-1">Send a test SMS to verify everything is working</span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
