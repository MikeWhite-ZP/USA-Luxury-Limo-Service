import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TwilioStatus {
  connected: boolean;
  accountSid?: string;
  phoneNumber?: string;
  error?: string;
}

export function AdminSMSSettings() {
  const { toast } = useToast();
  const [status, setStatus] = useState<TwilioStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sms/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch SMS status:', error);
      setStatus({ connected: false, error: 'Failed to check status' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

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

              {status?.connected ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Account SID:</span>
                    <span className="font-mono text-xs" data-testid="text-account-sid">
                      {status.accountSid ? `${status.accountSid.substring(0, 8)}...` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone Number:</span>
                    <span className="font-mono text-xs" data-testid="text-phone-number">
                      {status.phoneNumber || 'Not configured'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {status?.error || 'Twilio integration is not connected. Please set up the Twilio connector in your Replit settings.'}
                </div>
              )}

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

            {/* Test SMS */}
            {status?.connected && (
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
                When connected, SMS notifications will be automatically sent for:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Booking confirmations to passengers</li>
                <li>• Booking status updates (confirmed, in progress, completed)</li>
                <li>• Driver assignments to drivers</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Note:</strong> SMS notifications will only be sent if the Twilio connection is active and the user has a valid phone number on file.
              </p>
            </div>

            {/* Configuration Guide */}
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg space-y-2">
              <strong>Setup Instructions:</strong>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Sign up for a Twilio account at twilio.com</li>
                <li>Get your Account SID, API Key, and API Key Secret from the Twilio Console</li>
                <li>Purchase a phone number in the Twilio Console</li>
                <li>Configure the Twilio connector in your Replit integration settings</li>
                <li>Return here and click "Refresh Status" to verify the connection</li>
              </ol>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
