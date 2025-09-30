import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Users, Car, Star, Settings, MessageSquare, DollarSign, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface DashboardStats {
  totalRevenue: string;
  activeBookings: number;
  activeDrivers: number;
  averageRating: string;
}

interface ContactSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  serviceType?: string;
  message: string;
  status: 'new' | 'contacted' | 'resolved';
  createdAt: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    STRIPE_SECRET_KEY: '',
    STRIPE_PUBLIC_KEY: '',
    TOMTOM_API_KEY: ''
  });

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, user, isLoading, toast]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch contact submissions
  const { data: contacts, isLoading: contactsLoading } = useQuery<ContactSubmission[]>({
    queryKey: ['/api/admin/contacts'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Update settings mutation
  const settingsMutation = useMutation({
    mutationFn: async (settingsData: typeof settings) => {
      const response = await apiRequest('POST', '/api/admin/settings', { settings: settingsData });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "System configuration has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  // Update contact status mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/contacts/${id}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contacts'] });
      toast({
        title: "Status Updated",
        description: "Contact status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact status",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    if (!settings.STRIPE_SECRET_KEY || !settings.TOMTOM_API_KEY) {
      toast({
        title: "Missing Keys",
        description: "Please provide both Stripe and TomTom API keys",
        variant: "destructive",
      });
      return;
    }
    settingsMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="admin-title">Admin Control Panel</h1>
              <p className="text-primary-foreground/80" data-testid="admin-subtitle">
                Welcome, {user?.firstName || user?.email}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/logout'}
            variant="secondary"
            data-testid="button-logout"
          >
            Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="stat-revenue">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold" data-testid="total-revenue">
                    ${statsLoading ? '...' : stats?.totalRevenue || '0'}
                  </p>
                  <p className="text-xs text-green-600">+12.5% from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-bookings">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Bookings</p>
                  <p className="text-2xl font-bold" data-testid="active-bookings">
                    {statsLoading ? '...' : stats?.activeBookings || 0}
                  </p>
                  <p className="text-xs text-blue-600">8 pending approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-drivers">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Car className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Drivers</p>
                  <p className="text-2xl font-bold" data-testid="active-drivers">
                    {statsLoading ? '...' : stats?.activeDrivers || 0}
                  </p>
                  <p className="text-xs text-primary">3 pending verification</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-satisfaction">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Star className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                  <p className="text-2xl font-bold" data-testid="customer-satisfaction">
                    {statsLoading ? '...' : stats?.averageRating || '0'}/5
                  </p>
                  <p className="text-xs text-green-600">+0.2 this month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Management Quick Link */}
        <Card data-testid="pricing-management-link">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Pricing Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure pricing rules for all vehicle types and service options
                  </p>
                </div>
              </div>
              <Link href="/admin-pricing">
                <Button data-testid="button-manage-pricing">
                  Manage Pricing
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card data-testid="system-config">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>System Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Stripe API Keys</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="stripe-secret">Secret Key *</Label>
                    <Input
                      id="stripe-secret"
                      type="password"
                      placeholder="sk_test_..."
                      value={settings.STRIPE_SECRET_KEY}
                      onChange={(e) => setSettings(prev => ({ ...prev, STRIPE_SECRET_KEY: e.target.value }))}
                      data-testid="input-stripe-secret"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stripe-public">Publishable Key</Label>
                    <Input
                      id="stripe-public"
                      type="password"
                      placeholder="pk_test_..."
                      value={settings.STRIPE_PUBLIC_KEY}
                      onChange={(e) => setSettings(prev => ({ ...prev, STRIPE_PUBLIC_KEY: e.target.value }))}
                      data-testid="input-stripe-public"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">TomTom API Configuration</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="tomtom-key">TomTom API Key *</Label>
                    <Input
                      id="tomtom-key"
                      type="password"
                      placeholder="Your TomTom API key"
                      value={settings.TOMTOM_API_KEY}
                      onChange={(e) => setSettings(prev => ({ ...prev, TOMTOM_API_KEY: e.target.value }))}
                      data-testid="input-tomtom-key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="environment">Environment</Label>
                    <Select defaultValue="production">
                      <SelectTrigger data-testid="select-environment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production Environment</SelectItem>
                        <SelectItem value="test">Test Environment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSaveSettings}
              disabled={settingsMutation.isPending}
              data-testid="button-save-settings"
            >
              {settingsMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardContent>
        </Card>

        {/* Contact Submissions */}
        <Card data-testid="contact-submissions">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Contact Submissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contactsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : contacts && contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <div 
                    key={contact.id}
                    className="border rounded-lg p-4 space-y-3"
                    data-testid={`contact-${contact.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold" data-testid={`contact-name-${contact.id}`}>
                          {contact.firstName} {contact.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground" data-testid={`contact-email-${contact.id}`}>
                          {contact.email} {contact.phone && `• ${contact.phone}`}
                        </p>
                        {contact.serviceType && (
                          <Badge variant="outline" data-testid={`contact-service-${contact.id}`}>
                            {contact.serviceType}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select 
                          value={contact.status}
                          onValueChange={(value) => updateContactMutation.mutate({ id: contact.id, status: value })}
                        >
                          <SelectTrigger className="w-32" data-testid={`select-status-${contact.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge 
                          variant={contact.status === 'new' ? 'destructive' : contact.status === 'contacted' ? 'default' : 'secondary'}
                          data-testid={`status-badge-${contact.id}`}
                        >
                          {contact.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm" data-testid={`contact-message-${contact.id}`}>
                      {contact.message}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`contact-date-${contact.id}`}>
                      {new Date(contact.createdAt).toLocaleDateString()} at {new Date(contact.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground" data-testid="no-contacts">
                No contact submissions yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
