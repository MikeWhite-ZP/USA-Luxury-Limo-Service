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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TrendingUp, Users, Car, Star, Settings, MessageSquare, DollarSign, ArrowRight, Key, Edit2, Trash2, Plus, Check, X, ChevronDown, Pencil } from "lucide-react";
import { Link } from "wouter";

interface DashboardStats {
  totalRevenue: string;
  activeBookings: number;
  activeDrivers: number;
  averageRating: string;
  pendingBookings: number;
  pendingDrivers: number;
  revenueGrowth: string;
  ratingImprovement: string;
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

interface PaymentSystem {
  id: string;
  provider: 'stripe' | 'paypal' | 'square';
  isActive: boolean;
  publicKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  config: any;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'passenger' | 'driver' | 'dispatcher' | 'admin';
  isActive: boolean;
  payLaterEnabled: boolean;
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
  const [visibleCredentialsSection, setVisibleCredentialsSection] = useState<'api' | 'payment' | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<'all' | 'passenger' | 'driver' | 'dispatcher' | 'admin'>('all');
  const [showUserManager, setShowUserManager] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // User dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'passenger' as 'passenger' | 'driver' | 'dispatcher' | 'admin',
    isActive: true,
    payLaterEnabled: false,
  });

  // Payment configuration dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'paypal' | 'square' | null>(null);
  const [paymentCredentials, setPaymentCredentials] = useState({
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    clientId: '', // For PayPal
    clientSecret: '', // For PayPal
    applicationId: '', // For Square
    accessToken: '', // For Square
    locationId: '', // For Square
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

  // Fetch payment systems
  const { data: paymentSystems = [], isLoading: paymentSystemsLoading } = useQuery<PaymentSystem[]>({
    queryKey: ['/api/payment-systems'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch all users
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
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

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Updated",
        description: "User account has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Payment system mutations
  const updatePaymentSystemMutation = useMutation({
    mutationFn: async ({ provider, updates }: { provider: string; updates: Partial<PaymentSystem> }) => {
      const response = await apiRequest('PUT', `/api/payment-systems/${provider}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-systems'] });
      setConfigDialogOpen(false);
      setSelectedProvider(null);
      setPaymentCredentials({
        publicKey: '',
        secretKey: '',
        webhookSecret: '',
        clientId: '',
        clientSecret: '',
        applicationId: '',
        accessToken: '',
        locationId: '',
      });
      toast({
        title: "Payment System Updated",
        description: "Payment system configuration has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment system",
        variant: "destructive",
      });
    },
  });

  const setActivePaymentSystemMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest('PUT', `/api/payment-systems/${provider}/activate`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-systems'] });
      toast({
        title: "Active Payment System Changed",
        description: "The active payment system has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change active payment system",
        variant: "destructive",
      });
    },
  });

  const createPaymentSystemMutation = useMutation({
    mutationFn: async (system: Partial<PaymentSystem>) => {
      const response = await apiRequest('POST', '/api/payment-systems', system);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-systems'] });
      setConfigDialogOpen(false);
      setSelectedProvider(null);
      setPaymentCredentials({
        publicKey: '',
        secretKey: '',
        webhookSecret: '',
        clientId: '',
        clientSecret: '',
        applicationId: '',
        accessToken: '',
        locationId: '',
      });
      toast({
        title: "Payment System Created",
        description: "Payment system has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment system",
        variant: "destructive",
      });
    },
  });

  // Open configuration dialog for a provider
  const openConfigDialog = (provider: 'stripe' | 'paypal' | 'square') => {
    setSelectedProvider(provider);
    
    // Check if system already exists and prefill form
    const existingSystem = paymentSystems.find(s => s.provider === provider);
    if (existingSystem) {
      // Prefill based on provider type
      if (provider === 'stripe') {
        setPaymentCredentials({
          publicKey: existingSystem.publicKey || '',
          secretKey: '', // Don't prefill secrets
          webhookSecret: '',
          clientId: '',
          clientSecret: '',
          applicationId: '',
          accessToken: '',
          locationId: '',
        });
      } else if (provider === 'paypal') {
        setPaymentCredentials({
          publicKey: '',
          secretKey: '',
          webhookSecret: '',
          clientId: existingSystem.publicKey || '', // clientId stored as publicKey
          clientSecret: '', // Don't prefill secret
          applicationId: '',
          accessToken: '',
          locationId: '',
        });
      } else if (provider === 'square') {
        setPaymentCredentials({
          publicKey: '',
          secretKey: '',
          webhookSecret: '',
          clientId: '',
          clientSecret: '',
          applicationId: existingSystem.publicKey || '', // applicationId stored as publicKey
          accessToken: '', // Don't prefill token
          locationId: existingSystem.config?.locationId || '',
        });
      }
    }
    
    setConfigDialogOpen(true);
  };

  // Handle payment configuration submission
  const handlePaymentConfig = () => {
    if (!selectedProvider) return;

    const existingSystem = paymentSystems.find(s => s.provider === selectedProvider);
    let systemData: Partial<PaymentSystem> = {};

    // Configure based on provider type
    if (selectedProvider === 'stripe') {
      if (!existingSystem && (!paymentCredentials.publicKey || !paymentCredentials.secretKey)) {
        toast({
          title: "Missing Credentials",
          description: "Please provide both Publishable Key and Secret Key for Stripe.",
          variant: "destructive",
        });
        return;
      }
      if (paymentCredentials.publicKey) systemData.publicKey = paymentCredentials.publicKey;
      if (paymentCredentials.secretKey) systemData.secretKey = paymentCredentials.secretKey;
      if (paymentCredentials.webhookSecret) systemData.webhookSecret = paymentCredentials.webhookSecret;
    } else if (selectedProvider === 'paypal') {
      if (!existingSystem && (!paymentCredentials.clientId || !paymentCredentials.clientSecret)) {
        toast({
          title: "Missing Credentials",
          description: "Please provide both Client ID and Client Secret for PayPal.",
          variant: "destructive",
        });
        return;
      }
      if (paymentCredentials.clientId) systemData.publicKey = paymentCredentials.clientId;
      if (paymentCredentials.clientSecret) systemData.secretKey = paymentCredentials.clientSecret;
      if (paymentCredentials.webhookSecret) systemData.webhookSecret = paymentCredentials.webhookSecret;
    } else if (selectedProvider === 'square') {
      if (!existingSystem && (!paymentCredentials.applicationId || !paymentCredentials.accessToken)) {
        toast({
          title: "Missing Credentials",
          description: "Please provide both Application ID and Access Token for Square.",
          variant: "destructive",
        });
        return;
      }
      if (paymentCredentials.applicationId) systemData.publicKey = paymentCredentials.applicationId;
      if (paymentCredentials.accessToken) systemData.secretKey = paymentCredentials.accessToken;
      if (paymentCredentials.locationId) {
        systemData.config = { locationId: paymentCredentials.locationId };
      }
    }

    // Use update if system exists, create if new
    if (existingSystem) {
      updatePaymentSystemMutation.mutate({ 
        provider: selectedProvider, 
        updates: systemData 
      });
    } else {
      createPaymentSystemMutation.mutate({
        provider: selectedProvider,
        isActive: false,
        ...systemData
      });
    }
  };

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

  // User management functions
  const openAddUserDialog = () => {
    setEditingUser(null);
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: selectedUserType !== 'all' ? selectedUserType : 'passenger',
      isActive: true,
      payLaterEnabled: false,
    });
    setUserDialogOpen(true);
  };

  const openEditUserDialog = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
      payLaterEnabled: user.payLaterEnabled,
    });
    setUserDialogOpen(true);
  };

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof userFormData) => {
      const response = await apiRequest('POST', '/api/admin/users', userData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setUserDialogOpen(false);
      toast({
        title: "User Created",
        description: "The user has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const backfillDriversMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/backfill-drivers');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Driver Records Updated",
        description: data.message || `${data.created} driver records created`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to backfill driver records",
        variant: "destructive",
      });
    },
  });

  const handleSaveUser = () => {
    if (!userFormData.firstName || !userFormData.email) {
      toast({
        title: "Missing Information",
        description: "Please provide at least first name and email",
        variant: "destructive",
      });
      return;
    }

    if (editingUser) {
      // Update existing user
      updateUserMutation.mutate({ 
        id: editingUser.id, 
        updates: userFormData 
      });
      setUserDialogOpen(false);
    } else {
      // Create new user
      createUserMutation.mutate(userFormData);
    }
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

  // Credential metadata mapping for better UI display (Stripe keys moved to Payment Systems section)
  const credentialMetadata: Record<string, { label: string; description: string; category: string }> = {
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
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
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
        </div>
        
        {/* Navigation Menu */}
        <div className="border-t border-white/20">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex space-x-1" data-testid="admin-nav">
              <Link href="/admin-pricing">
                <Button 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-white/10 rounded-none border-b-2 border-transparent hover:border-white/50"
                  data-testid="nav-pricing"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pricing
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-primary-foreground hover:bg-white/10 rounded-none border-b-2 border-transparent hover:border-white/50"
                    data-testid="nav-credentials"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Credentials
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-[#ffffff]">
                  <DropdownMenuItem 
                    onClick={() => {
                      setVisibleCredentialsSection('api');
                      setTimeout(() => document.getElementById('credentials-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    data-testid="nav-api-credentials"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    API Credentials
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setVisibleCredentialsSection('payment');
                      setTimeout(() => document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    data-testid="nav-payment-systems"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Payment Systems
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-primary-foreground hover:bg-white/10 rounded-none border-b-2 border-transparent hover:border-white/50"
                    data-testid="nav-user-manager"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    User Manager
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-[#ffffff]">
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedUserType('all');
                      setShowUserManager(true);
                      setTimeout(() => document.getElementById('user-manager-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    data-testid="nav-all-users"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    All Users
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedUserType('passenger');
                      setShowUserManager(true);
                      setTimeout(() => document.getElementById('user-manager-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    data-testid="nav-passengers"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Passengers
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedUserType('driver');
                      setShowUserManager(true);
                      setTimeout(() => document.getElementById('user-manager-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    data-testid="nav-drivers"
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Drivers
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedUserType('dispatcher');
                      setShowUserManager(true);
                      setTimeout(() => document.getElementById('user-manager-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    data-testid="nav-dispatchers"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Dispatchers
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedUserType('admin');
                      setShowUserManager(true);
                      setTimeout(() => document.getElementById('user-manager-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    data-testid="nav-admins"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Admins
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="ghost" 
                className="text-primary-foreground hover:bg-white/10 rounded-none border-b-2 border-transparent hover:border-white/50"
                onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="nav-bookings"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Bookings
              </Button>
            </nav>
          </div>
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
                  {!statsLoading && stats && parseFloat(stats.revenueGrowth) !== 0 && (
                    <p className={`text-xs ${parseFloat(stats.revenueGrowth) > 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="revenue-growth">
                      {parseFloat(stats.revenueGrowth) > 0 ? '+' : ''}{stats.revenueGrowth}% from last month
                    </p>
                  )}
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
                  {!statsLoading && stats && stats.pendingBookings > 0 && (
                    <p className="text-xs text-blue-600" data-testid="pending-bookings">
                      {stats.pendingBookings} pending approval{stats.pendingBookings !== 1 ? 's' : ''}
                    </p>
                  )}
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
                  {!statsLoading && stats && stats.pendingDrivers > 0 && (
                    <p className="text-xs text-primary" data-testid="pending-drivers">
                      {stats.pendingDrivers} pending verification
                    </p>
                  )}
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
                  {!statsLoading && stats && parseFloat(stats.ratingImprovement) !== 0 && (
                    <p className={`text-xs ${parseFloat(stats.ratingImprovement) > 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="rating-improvement">
                      {parseFloat(stats.ratingImprovement) > 0 ? '+' : ''}{stats.ratingImprovement} this month
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Credentials Management */}
        {visibleCredentialsSection === 'api' && (
          <Card id="credentials-section" data-testid="credentials-management">
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
            {/* Existing Credentials (excluding Stripe - moved to Payment Systems) */}
            <div className="space-y-3">
              {credentials.filter(c => !c.key.includes('STRIPE')).map((credential) => (
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
        )}

        {/* Payment Systems Configuration */}
        {visibleCredentialsSection === 'payment' && (
          <Card id="payment-section" data-testid="payment-systems">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Payment Systems</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentSystemsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Configure and manage payment providers. Only one provider can be active at a time for system-wide payments.
                </p>

                {/* Payment System Cards */}
                <div className="grid gap-4">
                  {['stripe', 'paypal', 'square'].map((provider) => {
                    const system = paymentSystems.find(s => s.provider === provider);
                    const isActive = system?.isActive || false;
                    const providerLabels: Record<string, string> = {
                      stripe: 'Stripe',
                      paypal: 'PayPal',
                      square: 'Square'
                    };

                    return (
                      <div
                        key={provider}
                        className={`border rounded-lg p-4 ${isActive ? 'border-primary bg-primary/5' : ''}`}
                        data-testid={`payment-system-${provider}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-lg" data-testid={`payment-provider-${provider}`}>
                              {providerLabels[provider]}
                            </h4>
                            {isActive && (
                              <Badge className="bg-green-600" data-testid={`badge-active-${provider}`}>
                                Active
                              </Badge>
                            )}
                            {system && !isActive && (
                              <Badge variant="outline" data-testid={`badge-configured-${provider}`}>
                                Configured
                              </Badge>
                            )}
                          </div>
                          {!isActive && system && (
                            <Button
                              size="sm"
                              onClick={() => setActivePaymentSystemMutation.mutate(provider)}
                              disabled={setActivePaymentSystemMutation.isPending}
                              data-testid={`button-activate-${provider}`}
                            >
                              Set as Active
                            </Button>
                          )}
                        </div>

                        {system ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Public Key:</span>
                              <span className="font-mono text-xs">
                                {system.publicKey ? '••••••••' : 'Not set'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Secret Key:</span>
                              <span className="font-mono text-xs">
                                {system.secretKey ? '••••••••' : 'Not set'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Webhook Secret:</span>
                              <span className="font-mono text-xs">
                                {system.webhookSecret ? '••••••••' : 'Not set'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Not configured. Add credentials to enable this payment provider.
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() => openConfigDialog(provider as 'stripe' | 'paypal' | 'square')}
                          data-testid={`button-configure-${provider}`}
                        >
                          {system ? (
                            <>
                              <Edit2 className="w-4 h-4 mr-1" />
                              Edit Configuration
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Configure {providerLabels[provider]}
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Help Text */}
                <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
                  <strong>Note:</strong> Only one payment system can be active at a time. The active system will be used for all payment processing throughout the application.
                  Set environment variables STRIPE_SECRET_KEY and STRIPE_PUBLIC_KEY for Stripe integration.
                </div>
              </div>
            )}
          </CardContent>
          </Card>
        )}

        {/* Contact Submissions */}
        <Card id="contact-section" data-testid="contact-submissions">
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

        {/* User Accounts Management */}
        {showUserManager && (
          <Card id="user-manager-section" data-testid="user-accounts">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>
                  {selectedUserType === 'all' ? 'All Users' : 
                   selectedUserType === 'passenger' ? 'Passengers' :
                   selectedUserType === 'driver' ? 'Drivers' :
                   selectedUserType === 'dispatcher' ? 'Dispatchers' : 'Admins'}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => backfillDriversMutation.mutate()}
                  disabled={backfillDriversMutation.isPending}
                  variant="outline"
                  size="sm"
                  data-testid="button-backfill-drivers"
                >
                  {backfillDriversMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Fix Driver Records
                </Button>
                <Button
                  onClick={openAddUserDialog}
                  size="sm"
                  data-testid="button-add-user"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <div className="space-y-4">
                {/* Search Input */}
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="max-w-md"
                    data-testid="input-search-users"
                  />
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold">User</th>
                        <th className="text-left p-3 text-sm font-semibold">Email</th>
                        <th className="text-left p-3 text-sm font-semibold">Role</th>
                        <th className="text-left p-3 text-sm font-semibold">Status</th>
                        <th className="text-left p-3 text-sm font-semibold">Pay Later</th>
                        <th className="text-left p-3 text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers
                        .filter(u => selectedUserType === 'all' || u.role === selectedUserType)
                        .filter(u => {
                          if (!userSearchQuery) return true;
                          const query = userSearchQuery.toLowerCase();
                          return (
                            u.firstName?.toLowerCase().includes(query) ||
                            u.lastName?.toLowerCase().includes(query) ||
                            u.email?.toLowerCase().includes(query) ||
                            u.phone?.toLowerCase().includes(query) ||
                            `${u.firstName} ${u.lastName}`.toLowerCase().includes(query)
                          );
                        })
                        .map((u) => (
                        <tr 
                          key={u.id}
                          className="border-t hover:bg-muted/20 transition-colors"
                          data-testid={`user-row-${u.id}`}
                        >
                          <td className="p-3">
                            <div>
                              <p className="font-medium" data-testid={`user-name-${u.id}`}>
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(u.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="text-sm" data-testid={`user-email-${u.id}`}>{u.email}</p>
                            {u.phone && (
                              <p className="text-xs text-muted-foreground">{u.phone}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <Select
                              value={u.role}
                              onValueChange={(role) => updateUserMutation.mutate({ id: u.id, updates: { role: role as 'passenger' | 'driver' | 'dispatcher' | 'admin' } })}
                              disabled={updateUserMutation.isPending}
                            >
                              <SelectTrigger className="w-32" data-testid={`select-role-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="passenger">Passenger</SelectItem>
                                <SelectItem value="driver">Driver</SelectItem>
                                <SelectItem value="dispatcher">Dispatcher</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Select
                              value={u.isActive ? 'active' : 'inactive'}
                              onValueChange={(value) => updateUserMutation.mutate({ id: u.id, updates: { isActive: value === 'active' } })}
                              disabled={updateUserMutation.isPending}
                            >
                              <SelectTrigger className="w-28" data-testid={`select-status-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            {u.role === 'passenger' ? (
                              <Select
                                value={u.payLaterEnabled ? 'enabled' : 'disabled'}
                                onValueChange={(value) => updateUserMutation.mutate({ id: u.id, updates: { payLaterEnabled: value === 'enabled' } })}
                                disabled={updateUserMutation.isPending}
                              >
                                <SelectTrigger className="w-28" data-testid={`select-paylater-${u.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="enabled">Enabled</SelectItem>
                                  <SelectItem value="disabled">Disabled</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditUserDialog(u)}
                                data-testid={`button-edit-user-${u.id}`}
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${u.firstName} ${u.lastName}?`)) {
                                    deleteUserMutation.mutate(u.id);
                                  }
                                }}
                                disabled={deleteUserMutation.isPending}
                                data-testid={`button-delete-user-${u.id}`}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                  <strong>Pay Later Ability:</strong> When enabled for a passenger, they can complete trips and pay afterwards instead of at booking time. This option is only available for passenger accounts.
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground" data-testid="no-users">
                No users found.
              </div>
            )}
          </CardContent>
          </Card>
        )}

      </div>

      {/* Payment Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-[550px] bg-[#fdfeff]">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedProvider === 'stripe' ? 'Stripe' : selectedProvider === 'paypal' ? 'PayPal' : 'Square'} Payment
            </DialogTitle>
            <DialogDescription>
              Enter your {selectedProvider === 'stripe' ? 'Stripe' : selectedProvider === 'paypal' ? 'PayPal' : 'Square'} platform credentials. These will be securely stored.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedProvider === 'stripe' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="stripe-public-key">Publishable Key *</Label>
                  <Input
                    id="stripe-public-key"
                    placeholder="pk_live_..."
                    value={paymentCredentials.publicKey}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, publicKey: e.target.value })}
                    data-testid="input-stripe-public-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in Stripe Dashboard → Developers → API keys
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-secret-key">Secret Key *</Label>
                  <Input
                    id="stripe-secret-key"
                    type="password"
                    placeholder="sk_live_..."
                    value={paymentCredentials.secretKey}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, secretKey: e.target.value })}
                    data-testid="input-stripe-secret-key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this secure - never share publicly
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-webhook-secret">Webhook Signing Secret (Optional)</Label>
                  <Input
                    id="stripe-webhook-secret"
                    type="password"
                    placeholder="whsec_..."
                    value={paymentCredentials.webhookSecret}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, webhookSecret: e.target.value })}
                    data-testid="input-stripe-webhook-secret"
                  />
                  <p className="text-xs text-muted-foreground">
                    For webhook event verification (recommended for production)
                  </p>
                </div>
              </>
            )}

            {selectedProvider === 'paypal' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="paypal-client-id">Client ID *</Label>
                  <Input
                    id="paypal-client-id"
                    placeholder="AYSq3RDGsmBLJE-otTkBtM-jBRd1TCQwFf9RGfwddNXWz0uFU9ztymylOhRS..."
                    value={paymentCredentials.clientId}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, clientId: e.target.value })}
                    data-testid="input-paypal-client-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in PayPal Developer Dashboard → My Apps & Credentials
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal-client-secret">Client Secret *</Label>
                  <Input
                    id="paypal-client-secret"
                    type="password"
                    placeholder="Enter your PayPal client secret..."
                    value={paymentCredentials.clientSecret}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, clientSecret: e.target.value })}
                    data-testid="input-paypal-client-secret"
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this secure - never share publicly
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal-webhook-secret">Webhook ID (Optional)</Label>
                  <Input
                    id="paypal-webhook-secret"
                    placeholder="Enter webhook ID..."
                    value={paymentCredentials.webhookSecret}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, webhookSecret: e.target.value })}
                    data-testid="input-paypal-webhook-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    For webhook event verification
                  </p>
                </div>
              </>
            )}

            {selectedProvider === 'square' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="square-app-id">Application ID *</Label>
                  <Input
                    id="square-app-id"
                    placeholder="sq0idp-..."
                    value={paymentCredentials.applicationId}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, applicationId: e.target.value })}
                    data-testid="input-square-app-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in Square Developer Dashboard → Applications
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="square-access-token">Access Token *</Label>
                  <Input
                    id="square-access-token"
                    type="password"
                    placeholder="Enter your Square access token..."
                    value={paymentCredentials.accessToken}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, accessToken: e.target.value })}
                    data-testid="input-square-access-token"
                  />
                  <p className="text-xs text-muted-foreground">
                    Personal Access Token or Production Access Token
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="square-location-id">Location ID (Optional)</Label>
                  <Input
                    id="square-location-id"
                    placeholder="Enter location ID..."
                    value={paymentCredentials.locationId}
                    onChange={(e) => setPaymentCredentials({ ...paymentCredentials, locationId: e.target.value })}
                    data-testid="input-square-location-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Specific location for payments (if applicable)
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfigDialogOpen(false);
                setSelectedProvider(null);
                setPaymentCredentials({
                  publicKey: '',
                  secretKey: '',
                  webhookSecret: '',
                  clientId: '',
                  clientSecret: '',
                  applicationId: '',
                  accessToken: '',
                  locationId: '',
                });
              }}
              data-testid="button-cancel-config"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentConfig}
              disabled={createPaymentSystemMutation.isPending}
              data-testid="button-save-config"
            >
              {createPaymentSystemMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#fdfeff]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information and settings.' : 'Create a new user account with role and permissions.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-first-name">First Name *</Label>
                <Input
                  id="user-first-name"
                  placeholder="John"
                  value={userFormData.firstName}
                  onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                  data-testid="input-user-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-last-name">Last Name</Label>
                <Input
                  id="user-last-name"
                  placeholder="Doe"
                  value={userFormData.lastName}
                  onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                  data-testid="input-user-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                data-testid="input-user-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-phone">Phone Number</Label>
              <Input
                id="user-phone"
                placeholder="+1 234 567 8900"
                value={userFormData.phone}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                data-testid="input-user-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">Role *</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value) => setUserFormData({ ...userFormData, role: value as typeof userFormData.role })}
              >
                <SelectTrigger id="user-role" data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passenger">Passenger</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-status">Status</Label>
              <Select
                value={userFormData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setUserFormData({ ...userFormData, isActive: value === 'active' })}
              >
                <SelectTrigger id="user-status" data-testid="select-user-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userFormData.role === 'passenger' && (
              <div className="space-y-2">
                <Label htmlFor="user-paylater">Pay Later Ability</Label>
                <Select
                  value={userFormData.payLaterEnabled ? 'enabled' : 'disabled'}
                  onValueChange={(value) => setUserFormData({ ...userFormData, payLaterEnabled: value === 'enabled' })}
                >
                  <SelectTrigger id="user-paylater" data-testid="select-user-paylater">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Allow passenger to complete trips and pay afterwards
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserDialogOpen(false)}
              data-testid="button-cancel-user"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
              data-testid="button-save-user"
            >
              {(createUserMutation.isPending || updateUserMutation.isPending) ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
