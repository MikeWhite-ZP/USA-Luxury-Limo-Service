import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, MapPin, Clock, Users } from "lucide-react";

interface PaymentConfig {
  provider: 'stripe' | 'square' | null;
  configured: boolean;
  publishableKey?: string;
  applicationId?: string;
  locationId?: string;
  environment?: string;
}

interface BookingDetails {
  id: string;
  bookingType: 'transfer' | 'hourly';
  pickupAddress: string;
  destinationAddress?: string;
  scheduledDateTime: string;
  passengerCount: number;
  requestedHours?: number;
  totalAmount: string;
  vehicleType?: {
    name: string;
    passengerCapacity: number;
    luggageCapacity: string;
  };
}

// Stripe Checkout Form Component
const StripeCheckoutForm = ({ bookingId, amount, mode }: { bookingId?: string; amount: string; mode?: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  
  const handleBackToPaymentSelection = () => {
    setLocation('/booking?returnToPayment=true');
  };

  const { data: booking } = useQuery<BookingDetails>({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId && mode !== 'create',
  });

  useEffect(() => {
    if (mode === 'create') {
      const storedData = localStorage.getItem('pendingBookingForPayment');
      if (storedData) {
        setBookingData(JSON.parse(storedData));
      }
    }
  }, [mode]);

  const createBookingMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      if (!bookingData) throw new Error('No booking data found');
      
      const response = await apiRequest('POST', '/api/bookings', {
        ...bookingData,
        paymentMethod: 'pay_now',
        paymentStatus: 'paid',
        paymentIntentId,
      });
      return await response.json();
    },
    onSuccess: () => {
      localStorage.removeItem('pendingBookingForPayment');
      toast({
        title: "Booking Confirmed",
        description: "Your booking has been confirmed and paid successfully!",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      if (mode === 'create') {
        const result = await stripe.confirmPayment({
          elements,
          redirect: 'if_required' as any,
        });

        if (result.error) {
          toast({
            title: "Payment Failed",
            description: result.error.message || "Payment could not be processed.",
            variant: "destructive",
          });
        } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
          await createBookingMutation.mutateAsync(result.paymentIntent.id);
          window.location.href = '/passenger-dashboard?payment=success';
        }
      } else {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/passenger-dashboard?payment=success`,
          },
        });

        if (error) {
          toast({
            title: "Payment Failed",
            description: error.message || "Payment could not be processed.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Payment Successful",
            description: "Thank you for your booking! You will receive a confirmation shortly.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CheckoutLayout 
      booking={booking} 
      bookingData={bookingData} 
      amount={amount}
      onBack={handleBackToPaymentSelection}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 border rounded-lg">
          <PaymentElement
            options={{
              layout: {
                type: 'accordion',
                defaultCollapsed: false,
                radios: false,
                spacedAccordionItems: false
              }
            }}
          />
        </div>

        <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Secure Payment</p>
          <p>Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.</p>
        </div>

        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="w-full h-12 text-lg"
          data-testid="button-complete-payment"
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Processing...</span>
            </div>
          ) : (
            `Complete Payment - $${amount}`
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By completing your payment, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </CheckoutLayout>
  );
};

// Square Checkout Form Component
const SquareCheckoutForm = ({ 
  bookingId, 
  amount, 
  mode,
  applicationId,
  locationId,
  environment 
}: { 
  bookingId?: string; 
  amount: string; 
  mode?: string;
  applicationId: string;
  locationId: string;
  environment: string;
}) => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSquareLoaded, setIsSquareLoaded] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const cardRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  
  const handleBackToPaymentSelection = () => {
    setLocation('/booking?returnToPayment=true');
  };

  const { data: booking } = useQuery<BookingDetails>({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId && mode !== 'create',
  });

  useEffect(() => {
    if (mode === 'create') {
      const storedData = localStorage.getItem('pendingBookingForPayment');
      if (storedData) {
        setBookingData(JSON.parse(storedData));
      }
    }
  }, [mode]);

  // Load Square Web Payments SDK
  useEffect(() => {
    const loadSquareSDK = async () => {
      // Check if already loaded
      if ((window as any).Square) {
        await initializeSquarePayments();
        return;
      }

      // Load the SDK
      const script = document.createElement('script');
      script.src = environment === 'production' 
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';
      script.async = true;
      script.onload = async () => {
        await initializeSquarePayments();
      };
      script.onerror = () => {
        toast({
          title: "Payment Error",
          description: "Failed to load payment system. Please try again.",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);
    };

    const initializeSquarePayments = async () => {
      try {
        const Square = (window as any).Square;
        if (!Square) {
          throw new Error('Square SDK not loaded');
        }

        const payments = Square.payments(applicationId, locationId);
        paymentsRef.current = payments;

        const card = await payments.card();
        await card.attach('#square-card-container');
        cardRef.current = card;
        setIsSquareLoaded(true);
      } catch (error: any) {
        console.error('Square initialization error:', error);
        toast({
          title: "Payment Setup Error",
          description: error.message || "Failed to initialize payment form.",
          variant: "destructive",
        });
      }
    };

    loadSquareSDK();

    return () => {
      // Cleanup
      if (cardRef.current) {
        cardRef.current.destroy?.();
      }
    };
  }, [applicationId, locationId, environment, toast]);

  const createBookingMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      if (!bookingData) throw new Error('No booking data found');
      
      const response = await apiRequest('POST', '/api/bookings', {
        ...bookingData,
        paymentMethod: 'pay_now',
        paymentStatus: 'paid',
        paymentIntentId: paymentId,
      });
      return await response.json();
    },
    onSuccess: () => {
      localStorage.removeItem('pendingBookingForPayment');
      toast({
        title: "Booking Confirmed",
        description: "Your booking has been confirmed and paid successfully!",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardRef.current || !isSquareLoaded) {
      return;
    }

    setIsProcessing(true);

    try {
      // Tokenize the card
      const tokenResult = await cardRef.current.tokenize();
      
      if (tokenResult.status === 'OK') {
        // Send token to backend to complete payment
        const response = await apiRequest('POST', '/api/square-payment', {
          sourceId: tokenResult.token,
          amount: parseFloat(amount),
          bookingId: bookingId || undefined,
        });

        const result = await response.json();

        if (result.success) {
          if (mode === 'create') {
            await createBookingMutation.mutateAsync(result.paymentId);
          }
          toast({
            title: "Payment Successful",
            description: "Thank you for your booking! You will receive a confirmation shortly.",
          });
          window.location.href = '/passenger-dashboard?payment=success';
        } else {
          toast({
            title: "Payment Failed",
            description: result.message || "Payment could not be processed.",
            variant: "destructive",
          });
        }
      } else {
        const errorMessage = tokenResult.errors?.[0]?.message || 'Card verification failed';
        toast({
          title: "Payment Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Square payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CheckoutLayout 
      booking={booking} 
      bookingData={bookingData} 
      amount={amount}
      onBack={handleBackToPaymentSelection}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 border rounded-lg">
          <div id="square-card-container" className="min-h-[120px]">
            {!isSquareLoaded && (
              <div className="flex items-center justify-center h-[120px]">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Secure Payment</p>
          <p>Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.</p>
        </div>

        <Button
          type="submit"
          disabled={!isSquareLoaded || isProcessing}
          className="w-full h-12 text-lg"
          data-testid="button-complete-payment"
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Processing...</span>
            </div>
          ) : (
            `Complete Payment - $${amount}`
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By completing your payment, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </CheckoutLayout>
  );
};

// Shared Layout Component
const CheckoutLayout = ({ 
  booking, 
  bookingData, 
  amount, 
  onBack,
  children 
}: { 
  booking?: BookingDetails; 
  bookingData?: any;
  amount: string;
  onBack: () => void;
  children: React.ReactNode;
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold" data-testid="checkout-title">Complete Your Booking</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Booking Summary */}
        <Card data-testid="booking-summary">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Booking Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(booking || bookingData) ? (
              <>
                {/* Trip Information */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" data-testid="booking-type">
                      {(booking?.bookingType || bookingData?.bookingType || 'transfer').charAt(0).toUpperCase() + (booking?.bookingType || bookingData?.bookingType || 'transfer').slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground" data-testid="booking-date">
                      {new Date(booking?.scheduledDateTime || bookingData?.scheduledDateTime).toLocaleDateString()} at{' '}
                      {new Date(booking?.scheduledDateTime || bookingData?.scheduledDateTime).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Pickup Location</p>
                        <p className="text-sm text-muted-foreground" data-testid="pickup-address">
                          {booking?.pickupAddress || bookingData?.pickupAddress}
                        </p>
                      </div>
                    </div>

                    {(booking?.destinationAddress || bookingData?.destinationAddress) && (
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Destination</p>
                          <p className="text-sm text-muted-foreground" data-testid="destination-address">
                            {booking?.destinationAddress || bookingData?.destinationAddress}
                          </p>
                        </div>
                      </div>
                    )}

                    {(booking?.requestedHours || bookingData?.requestedHours) && (
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="font-medium">Duration</p>
                          <p className="text-sm text-muted-foreground" data-testid="requested-hours">
                            {booking?.requestedHours || bookingData?.requestedHours} hours
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle & Passenger Information */}
                {booking?.vehicleType && (
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-semibold">Vehicle & Passengers</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Vehicle Type</p>
                        <p className="font-medium" data-testid="vehicle-type">{booking?.vehicleType?.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Capacity</p>
                        <p className="font-medium" data-testid="vehicle-capacity">
                          {booking?.vehicleType?.passengerCapacity} passengers
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Luggage</p>
                        <p className="font-medium" data-testid="vehicle-luggage">
                          {booking?.vehicleType?.luggageCapacity}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Passengers</p>
                        <p className="font-medium" data-testid="passenger-count">
                          {booking?.passengerCount}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Breakdown */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold">Pricing</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span data-testid="subtotal">${amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxes & Fees</span>
                      <span data-testid="taxes">$0.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span data-testid="total-amount">${amount}</span>
                    </div>
                  </div>
                </div>

                {/* Service Inclusions */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold">Included in Your Booking</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Professional chauffeur service</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Complimentary bottled water</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Free WiFi and device chargers</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Meet & greet service</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>Free cancellation up to 2 hours before</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card data-testid="payment-form">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Payment Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function Checkout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [squareConfig, setSquareConfig] = useState<{ applicationId: string; locationId: string; environment: string } | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');
  const amount = urlParams.get('amount');
  const mode = urlParams.get('mode');

  // Fetch payment configuration
  useEffect(() => {
    const fetchPaymentConfig = async () => {
      try {
        const response = await fetch('/api/payment-config');
        const config: PaymentConfig = await response.json();
        setPaymentConfig(config);
        
        if (config.provider === 'stripe' && config.publishableKey) {
          setStripePromise(loadStripe(config.publishableKey));
        } else if (config.provider === 'square' && config.applicationId && config.locationId) {
          setSquareConfig({
            applicationId: config.applicationId,
            locationId: config.locationId,
            environment: config.environment || 'sandbox',
          });
        }
      } catch (error) {
        console.error('Failed to fetch payment config:', error);
        toast({
          title: "Payment Configuration Error",
          description: "Unable to load payment configuration. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (isAuthenticated) {
      fetchPaymentConfig();
    }
  }, [isAuthenticated, toast]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please sign in to complete your booking.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Create payment intent for Stripe
  const paymentMutation = useMutation({
    mutationFn: async ({ amount, bookingId, mode }: { amount: string; bookingId?: string; mode?: string }) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: parseFloat(amount),
        ...(bookingId && { bookingId }),
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.provider === 'stripe') {
        setClientSecret(data.clientSecret);
      }
      // For Square, the config is already fetched
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
        title: "Payment Setup Error",
        description: error.message || "Failed to setup payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (amount && isAuthenticated && paymentConfig?.provider === 'stripe') {
      if (mode === 'create' || bookingId) {
        paymentMutation.mutate({ amount, bookingId: bookingId || undefined, mode: mode || undefined });
      }
    }
  }, [bookingId, amount, mode, isAuthenticated, paymentConfig?.provider]);

  if (isLoading || !paymentConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check if payment is configured
  if (!paymentConfig.configured) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4" data-testid="error-title">
              Payment Not Configured
            </h1>
            <p className="text-muted-foreground mb-6" data-testid="error-message">
              Online payment is not currently available. Please contact support or choose a different payment method.
            </p>
            <Button onClick={() => window.location.href = '/'} data-testid="button-home">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Validate parameters based on mode
  if (!amount || (mode !== 'create' && !bookingId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4" data-testid="error-title">
              Invalid Checkout
            </h1>
            <p className="text-muted-foreground mb-6" data-testid="error-message">
              Missing booking information. Please start a new booking.
            </p>
            <Button onClick={() => window.location.href = '/'} data-testid="button-home">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Square checkout
  if (paymentConfig.provider === 'square' && squareConfig) {
    return (
      <div className="min-h-screen bg-background">
        <SquareCheckoutForm 
          bookingId={bookingId || undefined} 
          amount={amount} 
          mode={mode || undefined}
          applicationId={squareConfig.applicationId}
          locationId={squareConfig.locationId}
          environment={squareConfig.environment}
        />
      </div>
    );
  }

  // Render Stripe checkout
  if (paymentConfig.provider === 'stripe' && stripePromise) {
    if (!clientSecret) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground" data-testid="loading-message">
              Setting up secure payment...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripeCheckoutForm bookingId={bookingId || undefined} amount={amount} mode={mode || undefined} />
        </Elements>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Loading payment options...</p>
      </div>
    </div>
  );
}
