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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, Building, MapPin, Plus, Trash2, CreditCard } from "lucide-react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  lat?: string;
  lon?: string;
  isDefault: boolean;
}

interface Booking {
  id: string;
  bookingType: 'transfer' | 'hourly';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  pickupAddress: string;
  destinationAddress?: string;
  scheduledDateTime: string;
  totalAmount: string;
  createdAt: string;
}

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

function AddPaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      const response = await apiRequest('POST', '/api/payment-methods', {
        paymentMethodId: paymentMethod.id,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add payment method');
      }

      toast({
        title: "Success",
        description: "Payment method added successfully",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
        {isProcessing ? 'Adding...' : 'Add Payment Method'}
      </Button>
    </form>
  );
}

function PaymentMethodsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  const { data: paymentMethods, isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    retry: false,
  });

  const removePaymentMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest('DELETE', `/api/payment-methods/${paymentMethodId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Payment Method Removed",
        description: "The payment method has been removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove payment method",
        variant: "destructive",
      });
    },
  });

  const getBrandColor = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return 'bg-blue-600';
      case 'mastercard': return 'bg-red-600';
      case 'amex': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {paymentMethods && paymentMethods.length > 0 ? (
        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${getBrandColor(pm.card.brand)} rounded text-white text-xs flex items-center justify-center font-bold`}>
                  {pm.card.brand.toUpperCase().slice(0, 4)}
                </div>
                <div>
                  <p className="font-medium" data-testid={`card-number-${pm.id}`}>
                    •••• •••• •••• {pm.card.last4}
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid={`card-expiry-${pm.id}`}>
                    Expires {pm.card.exp_month}/{pm.card.exp_year}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removePaymentMutation.mutate(pm.id)}
                disabled={removePaymentMutation.isPending}
                data-testid={`button-remove-card-${pm.id}`}
              >
                {removePaymentMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 text-muted-foreground" data-testid="no-payment-methods">
          No payment methods saved yet. Add a payment method to get started.
        </div>
      )}

      <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
        <DialogTrigger asChild>
          <button
            className="w-full border-2 border-dashed border-border text-muted-foreground py-4 rounded-lg hover:border-primary hover:text-primary transition-colors"
            data-testid="button-add-payment"
          >
            <Plus className="w-5 h-5 mx-auto mb-2" />
            Add New Payment Method
          </button>
        </DialogTrigger>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#dcdee3] text-[12px]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <Elements stripe={stripePromise}>
            <AddPaymentMethodForm
              onSuccess={() => {
                setAddPaymentOpen(false);
                queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
              }}
            />
          </Elements>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PassengerDashboard() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    address: '',
    lat: '',
    lon: ''
  });
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Check for payment success in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed. You will receive a confirmation email shortly.",
        duration: 5000,
      });
      // Clear the URL parameter
      window.history.replaceState({}, '', '/passenger');
    }
  }, [toast]);

  // Redirect to home if not authenticated or not passenger
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'passenger')) {
      toast({
        title: "Unauthorized",
        description: "Passenger access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, user, isLoading, toast]);

  // Fetch saved addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery<SavedAddress[]>({
    queryKey: ['/api/saved-addresses'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'passenger',
  });

  // Fetch bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'passenger',
  });

  // Add saved address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (addressData: typeof newAddress) => {
      const response = await apiRequest('POST', '/api/saved-addresses', addressData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-addresses'] });
      setAddAddressOpen(false);
      setNewAddress({ label: '', address: '', lat: '', lon: '' });
      toast({
        title: "Address Saved",
        description: "Your address has been saved successfully.",
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
        description: error.message || "Failed to save address",
        variant: "destructive",
      });
    },
  });

  // Delete saved address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await apiRequest('DELETE', `/api/saved-addresses/${addressId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-addresses'] });
      toast({
        title: "Address Deleted",
        description: "Address has been removed from your saved locations.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive",
      });
    },
  });

  // TomTom address search with debouncing
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingAddress(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setAddressSuggestions(data.results);
          setShowSuggestions(true);
        } else {
          setAddressSuggestions([]);
          setShowSuggestions(false);
        }
      }
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Debounced address search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newAddress.address) {
        searchAddress(newAddress.address);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [newAddress.address]);

  const handleAddressSelect = (suggestion: any) => {
    const address = suggestion.address.freeformAddress;
    const lat = suggestion.position.lat.toString();
    const lon = suggestion.position.lon.toString();
    
    setNewAddress(prev => ({ ...prev, address, lat, lon }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleQuickBook = (address: SavedAddress) => {
    // Scroll to booking form and pre-fill the address
    const bookingForm = document.getElementById('hero-booking');
    if (bookingForm) {
      bookingForm.scrollIntoView({ behavior: 'smooth' });
      // Here you would typically pre-fill the booking form
      toast({
        title: "Quick Book",
        description: `Starting booking from ${address.label}`,
      });
    } else {
      // Navigate to home page with pre-filled address
      window.location.href = `/?from=${encodeURIComponent(address.address)}`;
    }
  };

  const getAddressIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('home')) return Home;
    if (lowerLabel.includes('work') || lowerLabel.includes('office')) return Building;
    return MapPin;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'confirmed': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'passenger') {
    return null;
  }

  const recentBookings = bookings?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-green-600 text-white p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">P</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="passenger-title">Passenger Account</h1>
              <p className="text-green-100" data-testid="passenger-subtitle">
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
        {/* Quick Book from Saved Locations */}
        <Card data-testid="saved-addresses">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Quick Book from Saved Locations</CardTitle>
              <Dialog open={addAddressOpen} onOpenChange={setAddAddressOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-address">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#dcdee3] text-[12px]" data-testid="add-address-dialog">
                  <DialogHeader>
                    <DialogTitle>Add New Address</DialogTitle>
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
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {addressSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                              onClick={() => handleAddressSelect(suggestion)}
                              data-testid={`suggestion-${index}`}
                            >
                              <div className="flex items-start space-x-2">
                                <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {suggestion.address.freeformAddress}
                                  </p>
                                  {suggestion.address.country && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
                      className="w-full"
                      data-testid="button-save-address"
                    >
                      {addAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {addressesLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : addresses && addresses.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {addresses.map((address) => {
                  const IconComponent = getAddressIcon(address.label);
                  return (
                    <div
                      key={address.id}
                      className="bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted/80 transition-colors group"
                      onClick={() => handleQuickBook(address)}
                      data-testid={`address-${address.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="w-5 h-5 text-primary" />
                          <span className="font-medium" data-testid={`address-label-${address.id}`}>
                            {address.label}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAddressMutation.mutate(address.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                          data-testid={`button-delete-address-${address.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground" data-testid={`address-text-${address.id}`}>
                        {address.address}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground" data-testid="no-addresses">
                No saved addresses yet. Add your frequently used locations for quick booking.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card data-testid="recent-bookings">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-muted rounded-lg p-4 flex justify-between items-center"
                    data-testid={`booking-${booking.id}`}
                  >
                    <div className="space-y-1">
                      <p className="font-medium" data-testid={`booking-route-${booking.id}`}>
                        {booking.pickupAddress} → {booking.destinationAddress || 'Hourly Service'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span data-testid={`booking-date-${booking.id}`}>
                          {new Date(booking.scheduledDateTime).toLocaleDateString()} • {new Date(booking.scheduledDateTime).toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" data-testid={`booking-type-${booking.id}`}>
                          {booking.bookingType}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-foreground" data-testid={`booking-total-${booking.id}`}>
                        ${booking.totalAmount}
                      </p>
                      <Badge variant={getStatusColor(booking.status)} data-testid={`booking-status-${booking.id}`}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground" data-testid="no-bookings">
                No bookings yet. Start your first ride with us!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card data-testid="payment-methods">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Payment Methods</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PaymentMethodsList />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card data-testid="quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={() => window.location.href = '/#hero-booking'}
                className="h-16 flex flex-col space-y-1"
                data-testid="button-book-ride"
              >
                <MapPin className="w-5 h-5" />
                <span>Book a Ride</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-16 flex flex-col space-y-1"
                data-testid="button-contact-support"
              >
                <Building className="w-5 h-5" />
                <span>Contact Support</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Ride History",
                    description: "Full ride history view coming soon!",
                  });
                }}
                className="h-16 flex flex-col space-y-1"
                data-testid="button-view-history"
              >
                <CreditCard className="w-5 h-5" />
                <span>View History</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
