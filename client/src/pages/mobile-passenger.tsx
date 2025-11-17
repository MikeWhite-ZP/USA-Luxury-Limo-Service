import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { 
  Car, 
  Calendar, 
  CreditCard, 
  FileText, 
  LogOut, 
  Plus,
  Clock,
  CheckCircle2,
  MapPin,
  DollarSign,
  Home,
  User,
  Menu,
  X,
  Trash2,
  Navigation,
  Edit2,
  Save,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Booking } from '@shared/schema';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

type Section = 'home' | 'new-booking' | 'saved-locations' | 'invoices' | 'payment' | 'account';

export default function MobilePassenger() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  // Add location dialog state
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [newAddress, setNewAddress] = useState({ label: '', address: '', lat: '', lon: '' });
  const [editAddress, setEditAddress] = useState({ label: '', address: '', lat: '', lon: '' });
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [editSuggestions, setEditSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSearchingEditAddress, setIsSearchingEditAddress] = useState(false);

  // Account editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user's bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    enabled: !!user,
  });

  // Fetch user's saved addresses
  const { data: savedAddresses, isLoading: savedAddressesLoading } = useQuery<any[]>({
    queryKey: ['/api/saved-addresses'],
    enabled: !!user,
  });

  // TomTom address search for new address
  useEffect(() => {
    if (!newAddress.address || newAddress.address.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const response = await fetch(
          `https://api.tomtom.com/search/2/search/${encodeURIComponent(newAddress.address)}.json?key=${import.meta.env.VITE_TOMTOM_API_KEY}&limit=5&countrySet=US`
        );
        const data = await response.json();
        setAddressSuggestions(data.results || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching address:', error);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [newAddress.address]);

  // TomTom address search for edit address
  useEffect(() => {
    if (!editAddress.address || editAddress.address.length < 3) {
      setEditSuggestions([]);
      setShowEditSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingEditAddress(true);
      try {
        const response = await fetch(
          `https://api.tomtom.com/search/2/search/${encodeURIComponent(editAddress.address)}.json?key=${import.meta.env.VITE_TOMTOM_API_KEY}&limit=5&countrySet=US`
        );
        const data = await response.json();
        setEditSuggestions(data.results || []);
        setShowEditSuggestions(true);
      } catch (error) {
        console.error('Error searching address:', error);
      } finally {
        setIsSearchingEditAddress(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [editAddress.address]);

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (data: { label: string; address: string; lat: string; lon: string }) => {
      const response = await apiRequest('POST', '/api/saved-addresses', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-addresses'] });
      setAddAddressOpen(false);
      setNewAddress({ label: '', address: '', lat: '', lon: '' });
      toast({
        title: 'Location Saved',
        description: 'The address has been added to your saved locations.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save address',
        variant: 'destructive',
      });
    },
  });

  // Edit address mutation
  const editAddressMutation = useMutation({
    mutationFn: async (data: { id: string; label: string; address: string; lat: string; lon: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PATCH', `/api/saved-addresses/${id}`, updateData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-addresses'] });
      setEditAddressOpen(false);
      setEditingAddress(null);
      setEditAddress({ label: '', address: '', lat: '', lon: '' });
      toast({
        title: 'Location Updated',
        description: 'The address has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update address',
        variant: 'destructive',
      });
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await apiRequest('DELETE', `/api/saved-addresses/${addressId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-addresses'] });
      toast({
        title: 'Location Deleted',
        description: 'Address has been removed from your saved locations.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete address',
        variant: 'destructive',
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email: string; phone?: string }) => {
      const response = await apiRequest('PATCH', '/api/user/profile', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setIsEditingProfile(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest('PATCH', '/api/user/password', data);
      return await response.json();
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
    },
  });

  // Initialize profile form when edit mode is enabled
  useEffect(() => {
    if (user && isEditingProfile) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user, isEditingProfile]);

  const handleAddressSelect = (suggestion: any) => {
    setNewAddress({
      ...newAddress,
      address: suggestion.address.freeformAddress,
      lat: suggestion.position.lat.toString(),
      lon: suggestion.position.lon.toString(),
    });
    setShowSuggestions(false);
  };

  const handleEditAddressSelect = (suggestion: any) => {
    setEditAddress({
      ...editAddress,
      address: suggestion.address.freeformAddress,
      lat: suggestion.position.lat.toString(),
      lon: suggestion.position.lon.toString(),
    });
    setShowEditSuggestions(false);
  };

  const handleEditClick = (location: any) => {
    setEditingAddress(location);
    setEditAddress({
      label: location.label,
      address: location.address,
      lat: location.lat || '',
      lon: location.lon || '',
    });
    setEditAddressOpen(true);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate('/mobile-login?role=passenger');
    return null;
  }

  // Separate bookings into upcoming and past
  const upcomingBookings = bookings?.filter(b => 
    b.status !== 'completed' && b.status !== 'cancelled'
  ) || [];
  
  // Past rides: completed or cancelled
  const pastBookings = bookings?.filter(b => 
    b.status === 'completed' || b.status === 'cancelled'
  ) || [];

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-600';
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'confirmed': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'on_the_way': return 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse';
      case 'arrived': return 'bg-cyan-50 text-cyan-700 border border-cyan-200 animate-pulse';
      case 'on_board': return 'bg-purple-50 text-purple-700 border border-purple-200 animate-pulse';
      case 'in_progress': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'completed': return 'bg-green-50 text-green-700 border border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatStatus = (status: string | null) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const menuItems = [
    { id: 'home' as Section, label: 'Home', icon: Home },
    { id: 'saved-locations' as Section, label: 'Saved', icon: MapPin },
    { id: 'invoices' as Section, label: 'Invoices', icon: FileText },
    { id: 'payment' as Section, label: 'Payment', icon: CreditCard },
    { id: 'account' as Section, label: 'Account', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200 shadow-lg">
        <div className="px-6 pt-6 pb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-600 mt-1 text-sm">{user.firstName || ''} {user.lastName || ''}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-700 hover:bg-gray-100 touch-manipulation"
                data-testid="button-menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-700 hover:bg-gray-100 touch-manipulation"
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-red-200 rounded-xl p-3 shadow-sm">
              <p className="text-gray-600 text-xs">Active</p>
              <p className="text-xl font-bold text-red-600 mt-1">{upcomingBookings.filter(b => ['confirmed', 'on_the_way', 'arrived', 'on_board'].includes(b.status || '')).length}</p>
            </div>
            <div className="bg-white border border-blue-200 rounded-xl p-3 shadow-sm">
              <p className="text-gray-600 text-xs">Upcoming</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{upcomingBookings.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <p className="text-gray-600 text-xs">Total</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{bookings?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-2 pt-2 pb-0 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'invoices') {
                      navigate('/mobile-invoices');
                    } else {
                      setActiveSection(item.id);
                    }
                    setMenuOpen(false);
                  }}
                  className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-t-lg transition-all touch-manipulation ${
                    isActive
                      ? 'bg-gray-50 text-red-600 shadow-lg border-t border-x border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : ''}`} />
                  <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? 'text-red-600' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-4">
        {/* Home Section */}
        {activeSection === 'home' && (
          <>
            {/* Quick Action Button */}
            <Button
              onClick={() => navigate('/mobile-booking')}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-2xl text-lg font-semibold shadow-lg transition-all transform active:scale-95"
              data-testid="button-new-booking-home"
            >
              <Plus className="w-6 h-6 mr-2" />
              Book New Ride
            </Button>

            {/* Bookings Section */}
            <Card className="shadow-md border-gray-200 bg-white">
              <CardHeader className="pb-3 bg-white border-b border-gray-100">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                  <Car className="w-5 h-5 text-red-600" />
                  My Rides
                </CardTitle>
              </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upcoming' | 'past')} className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-gray-100 mx-4 mb-3" style={{width: 'calc(100% - 2rem)'}}>
                <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:text-red-600" data-testid="tab-upcoming">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="data-[state=active]:bg-white data-[state=active]:text-red-600" data-testid="tab-past">
                  Past ({pastBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-0 px-4 pb-4">
                {bookingsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming rides</p>
                    <Button
                      variant="link"
                      onClick={() => navigate('/mobile-booking')}
                      className="mt-2"
                      data-testid="button-book-first-ride"
                    >
                      Book your first ride
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => navigate(`/mobile-booking-details/${booking.id}`)}
                        className="bg-white border border-gray-200 rounded-xl p-4 active:bg-gray-50 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                        data-testid={`booking-card-${booking.id}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {formatStatus(booking.status)}
                          </span>
                          <span className="text-lg font-bold text-gray-900">${booking.totalAmount}</span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-900">
                              {new Date(booking.scheduledDateTime).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{booking.pickupAddress}</p>
                              {booking.destinationAddress && (
                                <>
                                  <div className="h-4 w-px bg-gray-300 ml-2 my-1" />
                                  <p className="text-gray-600">{booking.destinationAddress}</p>
                                </>
                              )}
                            </div>
                          </div>

                          {booking.bookingType === 'hourly' && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>Hourly Service - {booking.requestedHours}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past" className="mt-0 px-4 pb-4">
                {bookingsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : pastBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No past rides yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastBookings.map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => navigate(`/mobile-booking-details/${booking.id}`)}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 active:bg-gray-100 transition-colors cursor-pointer opacity-90"
                        data-testid={`booking-card-${booking.id}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {formatStatus(booking.status)}
                          </span>
                          <span className="text-lg font-bold text-gray-900">${booking.totalAmount}</span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2 text-gray-600">
                            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{new Date(booking.scheduledDateTime).toLocaleString()}</span>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-900 font-medium">{booking.pickupAddress}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

            
          </>
        )}

        {/* Saved Locations Section */}
        {activeSection === 'saved-locations' && (
          <div className="space-y-3">
            <Card className="shadow-md border-gray-200 bg-white">
              <CardHeader className="bg-white border-b border-gray-100 p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-1.5 text-gray-900">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      Saved Locations
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">Your favorite places</CardDescription>
                  </div>
                  <Dialog open={addAddressOpen} onOpenChange={setAddAddressOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white shadow-sm h-7 px-2 text-xs"
                        data-testid="button-add-location"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card max-w-[90vw] sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Location</DialogTitle>
                        <DialogDescription>Save a location for quick booking</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="address-label">Label</Label>
                          <Input
                            id="address-label"
                            placeholder="Home, Work, Gym, etc."
                            value={newAddress.label}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                            data-testid="input-address-label"
                          />
                        </div>
                        <div className="relative">
                          <Label htmlFor="address-text">Address</Label>
                          <Input
                            id="address-text"
                            placeholder="123 Main Street, City, State"
                            value={newAddress.address}
                            onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                            onFocus={() => {
                              if (addressSuggestions.length > 0) {
                                setShowSuggestions(true);
                              }
                            }}
                            data-testid="input-address-text"
                            autoComplete="off"
                          />
                          {isSearchingAddress && (
                            <div className="absolute right-3 top-9 pointer-events-none">
                              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                          )}
                          {showSuggestions && addressSuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {addressSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  className="w-full text-left px-4 py-3 hover:bg-primary/5 border-b border-border last:border-0 transition-colors"
                                  onClick={() => handleAddressSelect(suggestion)}
                                  data-testid={`suggestion-${index}`}
                                >
                                  <div className="flex items-start space-x-2">
                                    <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">
                                        {suggestion.address.freeformAddress}
                                      </p>
                                      {suggestion.address.country && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          {suggestion.address.countrySubdivision}, {suggestion.address.country}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => addAddressMutation.mutate(newAddress)}
                          disabled={addAddressMutation.isPending || !newAddress.label || !newAddress.address}
                          className="w-full bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90"
                          data-testid="button-save-address"
                        >
                          {addAddressMutation.isPending ? 'Saving...' : 'Save Location'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                {savedAddressesLoading ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
                ) : !savedAddresses || savedAddresses.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No saved locations yet</p>
                    <p className="text-xs mt-1">Save locations during booking</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedAddresses.map((location) => (
                      <div
                        key={location.id}
                        className="bg-card border border-border rounded-lg p-2.5 hover:border-primary/50 hover:shadow-sm transition-all"
                        data-testid={`saved-location-${location.id}`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="bg-primary/10 p-1.5 rounded-md flex-shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h3 className="font-semibold text-foreground text-xs">{location.label}</h3>
                              {location.isDefault && (
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground break-words leading-tight">{location.address}</p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                          <div className="flex-1 grid grid-cols-2 gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/booking?from=${encodeURIComponent(location.address)}`)}
                              className="bg-card border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary text-[9px] h-6 px-1.5"
                              data-testid={`button-from-${location.id}`}
                            >
                              <Navigation className="w-2 h-2 mr-0.5" />
                              From
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/booking?to=${encodeURIComponent(location.address)}`)}
                              className="bg-card border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary text-[9px] h-6 px-1.5"
                              data-testid={`button-to-${location.id}`}
                            >
                              <MapPin className="w-2 h-2 mr-0.5" />
                              To
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClick(location)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/5 p-1 h-6 w-6"
                            data-testid={`button-edit-${location.id}`}
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (window.confirm(`Delete "${location.label}"?`)) {
                                deleteAddressMutation.mutate(location.id);
                              }
                            }}
                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 p-1 h-6 w-6"
                            data-testid={`button-delete-${location.id}`}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Address Dialog */}
            <Dialog open={editAddressOpen} onOpenChange={setEditAddressOpen}>
              <DialogContent className="bg-card max-w-[90vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Location</DialogTitle>
                  <DialogDescription>Update your saved location</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-address-label">Label</Label>
                    <Input
                      id="edit-address-label"
                      placeholder="Home, Work, Gym, etc."
                      value={editAddress.label}
                      onChange={(e) => setEditAddress(prev => ({ ...prev, label: e.target.value }))}
                      data-testid="input-edit-address-label"
                    />
                  </div>
                  <div className="relative">
                    <Label htmlFor="edit-address-text">Address</Label>
                    <Input
                      id="edit-address-text"
                      placeholder="123 Main Street, City, State"
                      value={editAddress.address}
                      onChange={(e) => setEditAddress(prev => ({ ...prev, address: e.target.value }))}
                      onFocus={() => {
                        if (editSuggestions.length > 0) {
                          setShowEditSuggestions(true);
                        }
                      }}
                      data-testid="input-edit-address-text"
                      autoComplete="off"
                    />
                    {isSearchingEditAddress && (
                      <div className="absolute right-3 top-9 pointer-events-none">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    )}
                    {showEditSuggestions && editSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {editSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full text-left px-4 py-3 hover:bg-primary/5 border-b border-border last:border-0 transition-colors"
                            onClick={() => handleEditAddressSelect(suggestion)}
                            data-testid={`edit-suggestion-${index}`}
                          >
                            <div className="flex items-start space-x-2">
                              <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {suggestion.address.freeformAddress}
                                </p>
                                {suggestion.address.country && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {suggestion.address.countrySubdivision}, {suggestion.address.country}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => editingAddress && editAddressMutation.mutate({ id: editingAddress.id, ...editAddress })}
                    disabled={editAddressMutation.isPending || !editAddress.label || !editAddress.address}
                    className="w-full bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90"
                    data-testid="button-update-address"
                  >
                    {editAddressMutation.isPending ? 'Updating...' : 'Update Location'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Payment Section */}
        {activeSection === 'payment' && (
          <div className="space-y-4">
            <Card className="shadow-sm border-2 border-border bg-card">
              <CardHeader className="bg-primary/5/50 border-b border-border p-4">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  Payment Methods
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">Manage your payment options</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-6">
                  <Button
                    onClick={() => navigate('/mobile-payment-methods')}
                    className="bg-card hover:bg-primary/5 text-primary border-2 border-primary/30 hover:border-primary/40 shadow-sm hover:shadow-md transition-all px-6 py-3 h-auto"
                    data-testid="button-manage-payment"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Payment Methods
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Account Section */}
        {activeSection === 'account' && (
          <div className="space-y-3">
            {/* Profile Information Card */}
            <Card className="shadow-sm border-2 border-border bg-card">
              <CardHeader className="bg-primary/5/50 border-b border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                      <div className="bg-primary/10 p-1.5 rounded-lg">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                      Profile Information
                    </CardTitle>
                  </div>
                  {!isEditingProfile ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingProfile(true)}
                      className="h-7 text-xs px-2 border-primary/40 text-primary hover:bg-primary/5"
                      data-testid="button-edit-profile"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          // Reset form to current user data
                          setProfileForm({
                            firstName: user.firstName || '',
                            lastName: user.lastName || '',
                            email: user.email || '',
                            phone: user.phone || ''
                          });
                        }}
                        className="h-7 text-xs px-2 border-slate-300 text-slate-700"
                        data-testid="button-cancel-edit"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateProfileMutation.mutate(profileForm)}
                        disabled={updateProfileMutation.isPending}
                        className="h-7 text-xs px-2 bg-blue-600 hover:bg-blue-700"
                        data-testid="button-save-profile"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {!isEditingProfile ? (
                  <div className="bg-accent/5 rounded-lg p-2.5 space-y-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Name</label>
                      <p className="text-sm font-medium mt-0.5" data-testid="text-name">{user.firstName} {user.lastName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Email</label>
                      <p className="text-sm font-medium mt-0.5" data-testid="text-email">{user.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Phone</label>
                      <p className="text-sm font-medium mt-0.5" data-testid="text-phone">{user.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Username</label>
                      <p className="text-sm font-medium mt-0.5" data-testid="text-username">{user.username}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="firstName" className="text-xs text-muted-foreground">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          className="h-8 text-sm mt-1"
                          data-testid="input-firstName"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-xs text-muted-foreground">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          className="h-8 text-sm mt-1"
                          data-testid="input-lastName"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="h-8 text-sm mt-1"
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="h-8 text-sm mt-1"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card className="shadow-sm border-2 border-border bg-card">
              <CardHeader className="bg-primary/5/50 border-b border-border p-3">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <div className="bg-primary/10 p-1.5 rounded-lg">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                  </div>
                  Change Password
                </CardTitle>
                <CardDescription className="text-xs mt-0.5 text-muted-foreground">Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <div>
                  <Label htmlFor="currentPassword" className="text-xs text-muted-foreground">Current Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="h-8 text-sm pr-8"
                      data-testid="input-currentPassword"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700"
                      data-testid="button-toggle-current-password"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-xs text-muted-foreground">New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="h-8 text-sm pr-8"
                      data-testid="input-newPassword"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700"
                      data-testid="button-toggle-new-password"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Must be 8+ characters with uppercase, lowercase, and number</p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="h-8 text-sm pr-8"
                      data-testid="input-confirmPassword"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700"
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                      toast({
                        title: 'Error',
                        description: 'New passwords do not match',
                        variant: 'destructive',
                      });
                      return;
                    }
                    updatePasswordMutation.mutate({
                      currentPassword: passwordForm.currentPassword,
                      newPassword: passwordForm.newPassword,
                    });
                  }}
                  disabled={updatePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="w-full h-8 text-xs bg-card hover:bg-primary/5 text-primary border-2 border-primary/30 hover:border-primary/40 shadow-sm hover:shadow-md transition-all"
                  data-testid="button-change-password"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <ThemeSwitcher />
          </div>
        )}
      </div>
    </div>
  );
}
