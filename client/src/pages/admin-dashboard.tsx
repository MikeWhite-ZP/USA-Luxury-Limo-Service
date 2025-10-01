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
import { TrendingUp, Users, Car, Star, Settings, MessageSquare, DollarSign, ArrowRight, Key, Edit2, Trash2, Plus, Check, X } from "lucide-react";
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

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loadingValue, setLoadingValue] = useState(false);

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

  // Fetch existing system settings
  const { data: settingsData } = useQuery<{
    credentials: Array<{
      key: string;
      hasValue: boolean;
      usesEnv: boolean;
      canDelete: boolean;
      updatedAt?: string;
    }>;
  }>({
    queryKey: ['/api/admin/settings'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

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

  // Update single credential mutation
  const updateCredentialMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiRequest('POST', '/api/admin/settings', { settings: { [key]: value } });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      setEditingKey(null);
      setNewKeyValue('');
      setIsAddingNew(false);
      setNewKeyName('');
      toast({
        title: "Credential Updated",
        description: "Credential has been saved successfully.",
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
      } else {
        toast({
          title: "Error",
          description: "Failed to update credential.",
          variant: "destructive",
        });
      }
    },
  });

  // Delete credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await apiRequest('DELETE', `/api/admin/settings/${key}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Credential Deleted",
        description: "Credential has been removed successfully.",
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

  const handleUpdateCredential = (key: string) => {
    if (!newKeyValue) {
      toast({
        title: "Missing Value",
        description: "Please provide a value for the credential",
        variant: "destructive",
      });
      return;
    }
    updateCredentialMutation.mutate({ key, value: newKeyValue });
  };

  const handleAddNewCredential = () => {
    if (!newKeyName || !newKeyValue) {
      toast({
        title: "Missing Information",
        description: "Please provide both credential name and value",
        variant: "destructive",
      });
      return;
    }
    updateCredentialMutation.mutate({ key: newKeyName.toUpperCase().replace(/\s+/g, '_'), value: newKeyValue });
  };

  const handleDeleteCredential = (key: string) => {
    if (confirm(`Are you sure you want to delete the ${key} credential?`)) {
      deleteCredentialMutation.mutate(key);
    }
  };

  const handleEditCredential = async (key: string) => {
    setEditingKey(key);
    setLoadingValue(true);
    
    try {
      // Fetch the actual credential value from the database
      const response = await fetch(`/api/admin/settings/${key}/value`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setNewKeyValue(data.value || '');
      } else if (response.status === 404) {
        // Credential not found in DB (env-only), show empty field
        setNewKeyValue('');
        toast({
          title: "Environment Variable",
          description: "This credential is from environment variables. Enter a new value to override it in the database.",
        });
      } else if (response.status === 401 || response.status === 403) {
        // Unauthorized - redirect to login
        setEditingKey(null);
        setNewKeyValue('');
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        // Other error
        setNewKeyValue('');
        toast({
          title: "Error",
          description: "Failed to load credential value",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to fetch credential value:', error);
      setNewKeyValue('');
      toast({
        title: "Error",
        description: "Failed to load credential value",
        variant: "destructive",
      });
    } finally {
      setLoadingValue(false);
    }
  };

  // Credential metadata mapping for better UI display
  const credentialMetadata: Record<string, { label: string; description: string; category: string }> = {
    'STRIPE_SECRET_KEY': { 
      label: 'Stripe Secret Key',
      description: 'Used for processing payments',
      category: 'Payment'
    },
    'STRIPE_PUBLIC_KEY': { 
      label: 'Stripe Publishable Key',
      description: 'Client-side Stripe integration',
      category: 'Payment'
    },
    'TOMTOM_API_KEY': { 
      label: 'TomTom API Key',
      description: 'Geocoding and routing services',
      category: 'Maps'
    },
  };

  // Build enhanced credentials list from API data
  const credentials = (settingsData?.credentials || []).map(cred => {
    const meta = credentialMetadata[cred.key] || {
      label: cred.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: 'Custom API credential',
      category: 'Custom'
    };
    
    return {
      ...cred,
      ...meta,
    };
  });

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

        {/* API Credentials Management */}
        <Card data-testid="credentials-management">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>API Credentials</span>
              </CardTitle>
              <Button
                onClick={() => setIsAddingNew(true)}
                variant="outline"
                size="sm"
                data-testid="button-add-credential"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Credential
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Credentials */}
            <div className="space-y-3">
              {credentials.map((credential) => (
                <div
                  key={credential.key}
                  className="border rounded-lg p-4"
                  data-testid={`credential-${credential.key.toLowerCase()}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold" data-testid={`credential-label-${credential.key.toLowerCase()}`}>
                          {credential.label}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {credential.category}
                        </Badge>
                        {credential.hasValue && (
                          <Badge 
                            variant={credential.usesEnv ? "secondary" : "default"}
                            className="text-xs"
                            data-testid={`credential-status-${credential.key.toLowerCase()}`}
                          >
                            {credential.usesEnv ? 'ENV' : 'DB'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {credential.description}
                      </p>
                      
                      {editingKey === credential.key ? (
                        <div className="mt-3 space-y-2">
                          {loadingValue ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                              Loading current value...
                            </div>
                          ) : (
                            <Input
                              type="text"
                              placeholder="Enter new value"
                              value={newKeyValue}
                              onChange={(e) => setNewKeyValue(e.target.value)}
                              data-testid={`input-edit-${credential.key.toLowerCase()}`}
                            />
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateCredential(credential.key)}
                              disabled={updateCredentialMutation.isPending || loadingValue}
                              data-testid={`button-save-${credential.key.toLowerCase()}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingKey(null);
                                setNewKeyValue('');
                              }}
                              data-testid={`button-cancel-${credential.key.toLowerCase()}`}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {credential.hasValue 
                            ? `Configured ${credential.usesEnv ? '(from environment variable)' : '(from database)'}`
                            : 'Not configured'}
                        </div>
                      )}
                    </div>
                    
                    {editingKey !== credential.key && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCredential(credential.key)}
                          data-testid={`button-edit-${credential.key.toLowerCase()}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {credential.canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCredential(credential.key)}
                            disabled={deleteCredentialMutation.isPending}
                            data-testid={`button-delete-${credential.key.toLowerCase()}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Credential Form */}
            {isAddingNew && (
              <div className="border border-dashed rounded-lg p-4 space-y-3" data-testid="add-credential-form">
                <h4 className="font-semibold">Add New Credential</h4>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="new-key-name">Credential Name</Label>
                    <Input
                      id="new-key-name"
                      placeholder="e.g., MAILGUN_API_KEY"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      data-testid="input-new-credential-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-key-value">Credential Value</Label>
                    <Input
                      id="new-key-value"
                      type="password"
                      placeholder="Enter credential value"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      data-testid="input-new-credential-value"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddNewCredential}
                    disabled={updateCredentialMutation.isPending}
                    data-testid="button-save-new-credential"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Add Credential
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewKeyName('');
                      setNewKeyValue('');
                    }}
                    data-testid="button-cancel-new-credential"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
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
