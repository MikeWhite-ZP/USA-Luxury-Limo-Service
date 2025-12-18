import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, CheckCircle, XCircle, Loader2, Eye, EyeOff, Save, Settings, AlertCircle, Server, Phone, Cloud, Zap } from 'lucide-react';

type SMSGatewayType = 'twilio' | 'amazon-sns' | 'plivo';

interface GatewayStatus {
  activeGateway: SMSGatewayType;
  smsEnabled: boolean;
  providers: {
    twilio: { configured: boolean; name: string };
    amazonSns: { configured: boolean; name: string };
    plivo: { configured: boolean; name: string };
  };
}

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  hasAuthToken?: boolean;
}

interface AmazonSNSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  senderId: string;
  hasSecretAccessKey?: boolean;
}

interface PlivoCredentials {
  authId: string;
  authToken: string;
  phoneNumber: string;
  hasAuthToken?: boolean;
}

export function AdminSMSSettings() {
  const { toast } = useToast();
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SMSGatewayType>('twilio');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [savingGateway, setSavingGateway] = useState(false);
  
  const [twilioCredentials, setTwilioCredentials] = useState<TwilioCredentials>({
    accountSid: '', authToken: '', phoneNumber: ''
  });
  const [snsCredentials, setSnsCredentials] = useState<AmazonSNSCredentials>({
    accessKeyId: '', secretAccessKey: '', region: 'us-east-1', senderId: ''
  });
  const [plivoCredentials, setPlivoCredentials] = useState<PlivoCredentials>({
    authId: '', authToken: '', phoneNumber: ''
  });
  
  const [editingTwilio, setEditingTwilio] = useState(false);
  const [editingSns, setEditingSns] = useState(false);
  const [editingPlivo, setEditingPlivo] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const fetchGatewayStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sms/gateway');
      const data = await response.json();
      setGatewayStatus(data);
    } catch (error) {
      console.error('Failed to fetch gateway status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTwilioCredentials = async () => {
    try {
      const response = await fetch('/api/admin/sms/status');
      const data = await response.json();
      setTwilioCredentials({
        accountSid: data.accountSid || '',
        authToken: '',
        phoneNumber: data.phoneNumber || '',
        hasAuthToken: data.hasAuthToken
      });
    } catch (error) {
      console.error('Failed to fetch Twilio credentials:', error);
    }
  };

  const fetchSnsCredentials = async () => {
    try {
      const response = await fetch('/api/admin/sms/credentials/amazon-sns');
      const data = await response.json();
      setSnsCredentials({
        accessKeyId: data.accessKeyId || '',
        secretAccessKey: '',
        region: data.region || 'us-east-1',
        senderId: data.senderId || '',
        hasSecretAccessKey: data.hasSecretAccessKey
      });
    } catch (error) {
      console.error('Failed to fetch SNS credentials:', error);
    }
  };

  const fetchPlivoCredentials = async () => {
    try {
      const response = await fetch('/api/admin/sms/credentials/plivo');
      const data = await response.json();
      setPlivoCredentials({
        authId: data.authId || '',
        authToken: '',
        phoneNumber: data.phoneNumber || '',
        hasAuthToken: data.hasAuthToken
      });
    } catch (error) {
      console.error('Failed to fetch Plivo credentials:', error);
    }
  };

  useEffect(() => {
    fetchGatewayStatus();
    fetchTwilioCredentials();
    fetchSnsCredentials();
    fetchPlivoCredentials();
  }, []);

  const handleSetActiveGateway = async (gateway: SMSGatewayType) => {
    setSavingGateway(true);
    try {
      const response = await fetch('/api/admin/sms/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway })
      });

      if (!response.ok) throw new Error('Failed to set gateway');

      toast({
        title: 'Gateway Updated',
        description: `Active SMS gateway set to ${gateway === 'amazon-sns' ? 'Amazon SNS' : gateway.charAt(0).toUpperCase() + gateway.slice(1)}`
      });
      
      await fetchGatewayStatus();
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSavingGateway(false);
    }
  };

  const handleToggleSMS = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/sms/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (!response.ok) throw new Error('Failed to toggle SMS');

      toast({
        title: enabled ? 'SMS Enabled' : 'SMS Disabled',
        description: enabled ? 'SMS notifications are now active' : 'SMS notifications have been disabled'
      });
      
      await fetchGatewayStatus();
    } catch (error: any) {
      toast({
        title: 'Toggle Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSaveTwilioCredentials = async () => {
    if (!twilioCredentials.accountSid || !twilioCredentials.phoneNumber) {
      toast({ title: 'Missing Fields', description: 'Account SID and Phone Number are required', variant: 'destructive' });
      return;
    }
    if (!twilioCredentials.hasAuthToken && !twilioCredentials.authToken) {
      toast({ title: 'Auth Token Required', description: 'Please enter your Twilio Auth Token', variant: 'destructive' });
      return;
    }

    setSavingCredentials(true);
    try {
      const body: any = {
        accountSid: twilioCredentials.accountSid,
        phoneNumber: twilioCredentials.phoneNumber,
        enabled: gatewayStatus?.smsEnabled ?? true
      };
      if (twilioCredentials.authToken) body.authToken = twilioCredentials.authToken;

      const response = await fetch('/api/admin/sms/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to save credentials');

      toast({ title: 'Saved', description: 'Twilio credentials saved successfully' });
      setEditingTwilio(false);
      await Promise.all([fetchGatewayStatus(), fetchTwilioCredentials()]);
    } catch (error: any) {
      toast({ title: 'Save Failed', description: error.message, variant: 'destructive' });
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleSaveSnsCredentials = async () => {
    if (!snsCredentials.accessKeyId || !snsCredentials.region) {
      toast({ title: 'Missing Fields', description: 'Access Key ID and Region are required', variant: 'destructive' });
      return;
    }
    if (!snsCredentials.hasSecretAccessKey && !snsCredentials.secretAccessKey) {
      toast({ title: 'Secret Key Required', description: 'Please enter your AWS Secret Access Key', variant: 'destructive' });
      return;
    }

    setSavingCredentials(true);
    try {
      const body: any = {
        accessKeyId: snsCredentials.accessKeyId,
        region: snsCredentials.region,
        senderId: snsCredentials.senderId
      };
      if (snsCredentials.secretAccessKey) body.secretAccessKey = snsCredentials.secretAccessKey;

      const response = await fetch('/api/admin/sms/credentials/amazon-sns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to save credentials');

      toast({ title: 'Saved', description: 'Amazon SNS credentials saved successfully' });
      setEditingSns(false);
      await Promise.all([fetchGatewayStatus(), fetchSnsCredentials()]);
    } catch (error: any) {
      toast({ title: 'Save Failed', description: error.message, variant: 'destructive' });
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleSavePlivoCredentials = async () => {
    if (!plivoCredentials.authId || !plivoCredentials.phoneNumber) {
      toast({ title: 'Missing Fields', description: 'Auth ID and Phone Number are required', variant: 'destructive' });
      return;
    }
    if (!plivoCredentials.hasAuthToken && !plivoCredentials.authToken) {
      toast({ title: 'Auth Token Required', description: 'Please enter your Plivo Auth Token', variant: 'destructive' });
      return;
    }

    setSavingCredentials(true);
    try {
      const body: any = {
        authId: plivoCredentials.authId,
        phoneNumber: plivoCredentials.phoneNumber
      };
      if (plivoCredentials.authToken) body.authToken = plivoCredentials.authToken;

      const response = await fetch('/api/admin/sms/credentials/plivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to save credentials');

      toast({ title: 'Saved', description: 'Plivo credentials saved successfully' });
      setEditingPlivo(false);
      await Promise.all([fetchGatewayStatus(), fetchPlivoCredentials()]);
    } catch (error: any) {
      toast({ title: 'Save Failed', description: error.message, variant: 'destructive' });
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleTestGateway = async (gateway: SMSGatewayType) => {
    try {
      const response = await fetch('/api/admin/sms/gateway/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway })
      });
      const result = await response.json();
      
      if (result.connected) {
        toast({ title: 'Connection Successful', description: `${gateway} connection verified` });
      } else {
        toast({ title: 'Connection Failed', description: result.error || 'Could not connect', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Test Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleSendTestSMS = async () => {
    if (!testPhoneNumber) {
      toast({ title: 'Phone Required', description: 'Enter a phone number to send test SMS', variant: 'destructive' });
      return;
    }

    setSendingTest(true);
    try {
      const response = await fetch('/api/admin/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: testPhoneNumber })
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: 'Test SMS Sent', description: result.message });
        setTestPhoneNumber('');
      } else {
        toast({ title: 'Test Failed', description: result.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Test Failed', description: error.message, variant: 'destructive' });
    } finally {
      setSendingTest(false);
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getGatewayLabel = (gateway: SMSGatewayType) => {
    switch (gateway) {
      case 'twilio': return 'Twilio';
      case 'amazon-sns': return 'Amazon SNS';
      case 'plivo': return 'Plivo';
    }
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-muted/30 to-card backdrop-blur-sm overflow-hidden">
      <CardHeader className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 border-b-0 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
        <CardTitle className="relative flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-pink-200/30 rounded-2xl blur-md opacity-60" />
            <div className="relative bg-white/20 backdrop-blur-sm p-3.5 rounded-2xl border border-white/30 shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">SMS Gateway Settings</h2>
            <p className="text-sm text-purple-100 mt-0.5 font-light">Configure SMS providers and send notifications</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-8 bg-gradient-to-b from-card to-muted/30">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border-2 border-border shadow-md p-8">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-border">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-2.5 rounded-xl">
                  <Settings className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-foreground">SMS Configuration</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-muted to-purple-50/30 dark:to-purple-900/30 rounded-xl p-6 border-2 border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-foreground text-lg mb-1">SMS Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        {gatewayStatus?.smsEnabled ? 'Active' : 'Disabled'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={gatewayStatus?.smsEnabled ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}>
                        {gatewayStatus?.smsEnabled ? 'ON' : 'OFF'}
                      </Badge>
                      <Switch
                        checked={gatewayStatus?.smsEnabled ?? false}
                        onCheckedChange={handleToggleSMS}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-muted to-blue-50/30 dark:to-blue-900/30 rounded-xl p-6 border-2 border-border">
                  <h4 className="font-bold text-foreground text-lg mb-3">Active Gateway</h4>
                  <Select
                    value={gatewayStatus?.activeGateway || 'twilio'}
                    onValueChange={(value) => handleSetActiveGateway(value as SMSGatewayType)}
                    disabled={savingGateway}
                  >
                    <SelectTrigger className="h-12 border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Twilio
                          {gatewayStatus?.providers.twilio.configured && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="amazon-sns">
                        <div className="flex items-center gap-2">
                          <Cloud className="w-4 h-4" />
                          Amazon SNS
                          {gatewayStatus?.providers.amazonSns.configured && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </SelectItem>
                      <SelectItem value="plivo">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Plivo
                          {gatewayStatus?.providers.plivo.configured && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SMSGatewayType)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-14 bg-muted rounded-xl p-1">
                <TabsTrigger value="twilio" className="rounded-lg h-12 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
                  <Phone className="w-4 h-4 mr-2" />
                  Twilio
                </TabsTrigger>
                <TabsTrigger value="amazon-sns" className="rounded-lg h-12 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white">
                  <Cloud className="w-4 h-4 mr-2" />
                  Amazon SNS
                </TabsTrigger>
                <TabsTrigger value="plivo" className="rounded-lg h-12 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
                  <Zap className="w-4 h-4 mr-2" />
                  Plivo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="twilio" className="mt-6">
                <div className="bg-card rounded-2xl border-2 border-border shadow-md p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-2.5 rounded-xl">
                        <Phone className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">Twilio Credentials</h3>
                        <p className="text-sm text-muted-foreground">Industry-leading SMS API</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {gatewayStatus?.providers.twilio.configured ? (
                        <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Configured</Badge>
                      ) : (
                        <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Not Configured</Badge>
                      )}
                      {!editingTwilio && (
                        <Button onClick={() => setEditingTwilio(true)} variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-1" />Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {editingTwilio ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Account SID</Label>
                        <Input
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          value={twilioCredentials.accountSid}
                          onChange={(e) => setTwilioCredentials(prev => ({ ...prev, accountSid: e.target.value }))}
                          className="h-12 mt-2"
                        />
                      </div>
                      <div>
                        <Label>Auth Token {twilioCredentials.hasAuthToken && <span className="text-xs text-muted-foreground">(leave empty to keep existing)</span>}</Label>
                        <div className="relative mt-2">
                          <Input
                            type={showSecrets.twilioAuth ? 'text' : 'password'}
                            placeholder={twilioCredentials.hasAuthToken ? 'Leave empty to keep existing' : 'Your Auth Token'}
                            value={twilioCredentials.authToken}
                            onChange={(e) => setTwilioCredentials(prev => ({ ...prev, authToken: e.target.value }))}
                            className="h-12 pr-10"
                          />
                          <button type="button" onClick={() => toggleSecret('twilioAuth')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showSecrets.twilioAuth ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <Input
                          placeholder="+1234567890"
                          value={twilioCredentials.phoneNumber}
                          onChange={(e) => setTwilioCredentials(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="h-12 mt-2"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button onClick={handleSaveTwilioCredentials} disabled={savingCredentials} className="bg-purple-600 hover:bg-purple-700">
                          {savingCredentials ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => { setEditingTwilio(false); fetchTwilioCredentials(); }}>Cancel</Button>
                        <Button variant="outline" onClick={() => handleTestGateway('twilio')}>
                          <Server className="w-4 h-4 mr-2" />Test Connection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <div className="flex justify-between bg-muted rounded-lg p-4">
                        <span className="text-sm font-medium text-muted-foreground">Account SID:</span>
                        <span className="font-mono text-sm">{twilioCredentials.accountSid ? `${twilioCredentials.accountSid.substring(0, 12)}...` : 'Not set'}</span>
                      </div>
                      <div className="flex justify-between bg-muted rounded-lg p-4">
                        <span className="text-sm font-medium text-muted-foreground">Auth Token:</span>
                        <span className="font-mono text-sm">{twilioCredentials.hasAuthToken ? '••••••••••••' : 'Not set'}</span>
                      </div>
                      <div className="flex justify-between bg-muted rounded-lg p-4">
                        <span className="text-sm font-medium text-muted-foreground">Phone Number:</span>
                        <span className="font-mono text-sm">{twilioCredentials.phoneNumber || 'Not set'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="amazon-sns" className="mt-6">
                <div className="bg-card rounded-2xl border-2 border-border shadow-md p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900 p-2.5 rounded-xl">
                        <Cloud className="w-5 h-5 text-orange-700 dark:text-orange-300" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">Amazon SNS Credentials</h3>
                        <p className="text-sm text-muted-foreground">AWS Simple Notification Service</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {gatewayStatus?.providers.amazonSns.configured ? (
                        <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Configured</Badge>
                      ) : (
                        <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Not Configured</Badge>
                      )}
                      {!editingSns && (
                        <Button onClick={() => setEditingSns(true)} variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-1" />Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {editingSns ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Access Key ID</Label>
                        <Input
                          placeholder="AKIAXXXXXXXXXXXXXXXX"
                          value={snsCredentials.accessKeyId}
                          onChange={(e) => setSnsCredentials(prev => ({ ...prev, accessKeyId: e.target.value }))}
                          className="h-12 mt-2"
                        />
                      </div>
                      <div>
                        <Label>Secret Access Key {snsCredentials.hasSecretAccessKey && <span className="text-xs text-muted-foreground">(leave empty to keep existing)</span>}</Label>
                        <div className="relative mt-2">
                          <Input
                            type={showSecrets.snsSecret ? 'text' : 'password'}
                            placeholder={snsCredentials.hasSecretAccessKey ? 'Leave empty to keep existing' : 'Your Secret Access Key'}
                            value={snsCredentials.secretAccessKey}
                            onChange={(e) => setSnsCredentials(prev => ({ ...prev, secretAccessKey: e.target.value }))}
                            className="h-12 pr-10"
                          />
                          <button type="button" onClick={() => toggleSecret('snsSecret')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showSecrets.snsSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label>Region</Label>
                        <Select value={snsCredentials.region} onValueChange={(v) => setSnsCredentials(prev => ({ ...prev, region: v }))}>
                          <SelectTrigger className="h-12 mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                            <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                            <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                            <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Sender ID (Optional)</Label>
                        <Input
                          placeholder="CompanyName"
                          value={snsCredentials.senderId}
                          onChange={(e) => setSnsCredentials(prev => ({ ...prev, senderId: e.target.value }))}
                          className="h-12 mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Alphanumeric sender ID (max 11 chars, not supported in all countries)</p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button onClick={handleSaveSnsCredentials} disabled={savingCredentials} className="bg-orange-600 hover:bg-orange-700">
                          {savingCredentials ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => { setEditingSns(false); fetchSnsCredentials(); }}>Cancel</Button>
                        <Button variant="outline" onClick={() => handleTestGateway('amazon-sns')}>
                          <Server className="w-4 h-4 mr-2" />Test Connection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <div className="flex justify-between bg-muted rounded-lg p-4">
                        <span className="text-sm font-medium text-muted-foreground">Access Key ID:</span>
                        <span className="font-mono text-sm">{snsCredentials.accessKeyId ? `${snsCredentials.accessKeyId.substring(0, 8)}...` : 'Not set'}</span>
                      </div>
                      <div className="flex justify-between bg-muted rounded-lg p-4">
                        <span className="text-sm font-medium text-muted-foreground">Secret Access Key:</span>
                        <span className="font-mono text-sm">{snsCredentials.hasSecretAccessKey ? '••••••••••••' : 'Not set'}</span>
                      </div>
                      <div className="flex justify-between bg-muted rounded-lg p-4">
                        <span className="text-sm font-medium text-muted-foreground">Region:</span>
                        <span className="font-mono text-sm">{snsCredentials.region}</span>
                      </div>
                      <div className="flex justify-between bg-muted rounded-lg p-4">
                        <span className="text-sm font-medium text-muted-foreground">Sender ID:</span>
                        <span className="font-mono text-sm">{snsCredentials.senderId || 'Not set'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="plivo" className="mt-6">
                <div className="bg-card rounded-2xl border-2 border-border shadow-md p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 p-2.5 rounded-xl">
                        <Zap className="w-5 h-5 text-green-700 dark:text-green-300" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">Plivo Credentials</h3>
                        <p className="text-sm text-muted-foreground">Cost-effective SMS API</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {gatewayStatus?.providers.plivo.configured ? (
                        <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Configured</Badge>
                      ) : (
                        <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Not Configured</Badge>
                      )}
                      {!editingPlivo && (
                        <Button onClick={() => setEditingPlivo(true)} variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-1" />Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {editingPlivo ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Auth ID</Label>
                        <Input
                          placeholder="Your Plivo Auth ID"
                          value={plivoCredentials.authId}
                          onChange={(e) => setPlivoCredentials(prev => ({ ...prev, authId: e.target.value }))}
                          className="h-12 mt-2"
                        />
                      </div>
                      <div>
                        <Label>Auth Token {plivoCredentials.hasAuthToken && <span className="text-xs text-muted-foreground">(leave empty to keep existing)</span>}</Label>
                        <div className="relative mt-2">
                          <Input
                            type={showSecrets.plivoAuth ? 'text' : 'password'}
                            placeholder={plivoCredentials.hasAuthToken ? 'Leave empty to keep existing' : 'Your Auth Token'}
                            value={plivoCredentials.authToken}
                            onChange={(e) => setPlivoCredentials(prev => ({ ...prev, authToken: e.target.value }))}
                            className="h-12 pr-10"
                          />
                          <button type="button" onClick={() => toggleSecret('plivoAuth')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showSecrets.plivoAuth ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <Input
                          placeholder="+1234567890"
                          value={plivoCredentials.phoneNumber}
                          onChange={(e) => setPlivoCredentials(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="h-12 mt-2"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button onClick={handleSavePlivoCredentials} disabled={savingCredentials} className="bg-green-600 hover:bg-green-700">
                          {savingCredentials ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => { setEditingPlivo(false); fetchPlivoCredentials(); }}>Cancel</Button>
                        <Button variant="outline" onClick={() => handleTestGateway('plivo')}>
                          <Server className="w-4 h-4 mr-2" />Test Connection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <div className="flex justify-between bg-muted rounded-lg p-4">
                        <span className="text-sm font-medium text-muted-foreground">Auth ID:</span>
                        <span className="font-mono text-sm">{plivoCredentials.authId ? `${plivoCredentials.authId.substring(0, 12)}...` : 'Not set'}</span>
                      </div>
                      <div className="flex justify-between bg-muted rounded-lg p-4">
                        <span className="text-sm font-medium text-muted-foreground">Auth Token:</span>
                        <span className="font-mono text-sm">{plivoCredentials.hasAuthToken ? '••••••••••••' : 'Not set'}</span>
                      </div>
                      <div className="flex justify-between bg-muted rounded-lg p-4">
                        <span className="text-sm font-medium text-muted-foreground">Phone Number:</span>
                        <span className="font-mono text-sm">{plivoCredentials.phoneNumber || 'Not set'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {gatewayStatus?.smsEnabled && (
              <div className="bg-card rounded-2xl border-2 border-border shadow-md p-8 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 p-2.5 rounded-xl">
                    <Send className="w-5 h-5 text-green-700 dark:text-green-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Send Test SMS</h3>
                    <p className="text-sm text-muted-foreground">Uses active gateway: {getGatewayLabel(gatewayStatus.activeGateway)}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    className="h-12 flex-1"
                  />
                  <Button
                    onClick={handleSendTestSMS}
                    disabled={sendingTest || !testPhoneNumber}
                    className="h-12 bg-green-600 hover:bg-green-700"
                  >
                    {sendingTest ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send Test
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-muted via-card to-muted rounded-2xl border-2 border-border shadow-md p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-foreground">Provider Comparison</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-card p-4 rounded-xl border">
                  <h4 className="font-bold text-purple-600 mb-2">Twilio</h4>
                  <p className="text-muted-foreground">~$0.0079/SMS (US)</p>
                  <p className="text-muted-foreground">Industry standard, reliable</p>
                </div>
                <div className="bg-card p-4 rounded-xl border">
                  <h4 className="font-bold text-orange-600 mb-2">Amazon SNS</h4>
                  <p className="text-muted-foreground">~$0.00645/SMS (US)</p>
                  <p className="text-muted-foreground">AWS integration, scalable</p>
                </div>
                <div className="bg-card p-4 rounded-xl border">
                  <h4 className="font-bold text-green-600 mb-2">Plivo</h4>
                  <p className="text-muted-foreground">~$0.0050/SMS (US)</p>
                  <p className="text-muted-foreground">Cost-effective, good coverage</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
