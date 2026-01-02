import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, CreditCard, MapPin, Clock, AlertCircle, Loader2 } from "lucide-react";

interface PaymentConfig {
  provider: 'stripe' | 'square' | null;
  configured: boolean;
  publishableKey?: string;
  applicationId?: string;
  locationId?: string;
  environment?: string;
}

interface InvoiceData {
  invoice: {
    id: string;
    invoiceNumber: string;
    bookingId: string;
    subtotal: string;
    totalAmount: string;
    paidAt: string | null;
    createdAt: string;
  };
  booking: {
    id: string;
    bookingType: 'transfer' | 'hourly';
    pickupAddress: string;
    destinationAddress?: string;
    scheduledDateTime: string;
    passengerCount: number;
    requestedHours?: number;
  };
  passenger: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

const StripePaymentForm = ({ token, invoiceData }: { token: string; invoiceData: InvoiceData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const returnUrl = user 
        ? `${window.location.origin}/passenger?payment=success`
        : `${window.location.origin}/pay/${token}/success`;

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful!",
          description: "Your invoice has been paid successfully.",
        });
        
        if (user) {
          setLocation('/passenger?payment=success');
        } else {
          setLocation(`/pay/${token}/success`);
        }
      } else if (paymentIntent) {
        toast({
          title: "Processing Payment",
          description: "Please complete the authentication step.",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="payment-form">
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <PaymentElement />
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        size="lg"
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ${parseFloat(invoiceData.invoice.totalAmount).toFixed(2)}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secured. We never store your card details.
      </p>
    </form>
  );
};

const SquarePaymentForm = ({ 
  token, 
  invoiceData,
  applicationId,
  locationId,
  environment 
}: { 
  token: string; 
  invoiceData: InvoiceData;
  applicationId: string;
  locationId: string;
  environment: string;
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSquareLoaded, setIsSquareLoaded] = useState(false);
  const cardRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);

  useEffect(() => {
    const loadSquareSDK = async () => {
      if ((window as any).Square) {
        await initializeSquarePayments();
        return;
      }

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
        await card.attach('#square-card-container-invoice');
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
      if (cardRef.current) {
        cardRef.current.destroy?.();
      }
    };
  }, [applicationId, locationId, environment, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardRef.current || !isSquareLoaded) {
      return;
    }

    setIsProcessing(true);

    try {
      const tokenResult = await cardRef.current.tokenize();
      
      if (tokenResult.status === 'OK') {
        const response = await apiRequest('POST', '/api/square-payment/invoice', {
          sourceId: tokenResult.token,
          token,
          invoiceId: invoiceData.invoice.id,
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: "Payment Successful!",
            description: "Your invoice has been paid successfully.",
          });
          
          if (user) {
            setLocation('/passenger?payment=success');
          } else {
            setLocation(`/pay/${token}/success`);
          }
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
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="payment-form">
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <div id="square-card-container-invoice" className="min-h-[120px]">
          {!isSquareLoaded && (
            <div className="flex items-center justify-center h-[120px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={!isSquareLoaded || isProcessing} 
        className="w-full"
        size="lg"
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ${parseFloat(invoiceData.invoice.totalAmount).toFixed(2)}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secured. We never store your card details.
      </p>
    </form>
  );
};

const PaymentFormWrapper = ({ token, invoiceData }: { token: string; invoiceData: InvoiceData }) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [squareConfig, setSquareConfig] = useState<{ applicationId: string; locationId: string; environment: string } | null>(null);
  const [provider, setProvider] = useState<'stripe' | 'square' | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // First fetch payment config to get the provider type and keys
        const configResponse = await fetch('/api/payment-config');
        const config: PaymentConfig = await configResponse.json();

        if (!config.configured || !config.provider) {
          setError('Payment system is not configured');
          setLoading(false);
          return;
        }

        setProvider(config.provider);

        // Create payment intent
        const response = await apiRequest('POST', '/api/payment-intents/invoice', {
          token,
          invoiceId: invoiceData.invoice.id,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create payment intent');
        }

        const data = await response.json();

        if (data.provider === 'stripe') {
          if (config.publishableKey) {
            setStripePromise(loadStripe(config.publishableKey));
          }
          setClientSecret(data.clientSecret);
        } else if (data.provider === 'square') {
          setSquareConfig({
            applicationId: data.applicationId,
            locationId: data.locationId,
            environment: data.environment || 'sandbox',
          });
        }
      } catch (err: any) {
        console.error('Payment initialization error:', err);
        setError(err.message || 'Failed to initialize payment');
        toast({
          title: "Error",
          description: err.message || "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [token, invoiceData.invoice.id, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (provider === 'square' && squareConfig) {
    return (
      <SquarePaymentForm 
        token={token} 
        invoiceData={invoiceData}
        applicationId={squareConfig.applicationId}
        locationId={squareConfig.locationId}
        environment={squareConfig.environment}
      />
    );
  }

  if (provider === 'stripe' && stripePromise && clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <StripePaymentForm token={token} invoiceData={invoiceData} />
      </Elements>
    );
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
        <AlertCircle className="w-5 h-5" />
        <p className="font-medium">Failed to initialize payment</p>
      </div>
    </div>
  );
};

export default function PayInvoice() {
  const { token } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/payment-tokens/${token}`],
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6" />
              <CardTitle>Invalid Payment Link</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {data?.message || 'This payment link is invalid, expired, or has already been used.'}
            </p>
            <Button 
              onClick={() => setLocation('/')} 
              variant="outline" 
              className="w-full"
              data-testid="button-go-home"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invoiceData = data as InvoiceData;

  if (invoiceData.invoice.paidAt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              <CardTitle>Invoice Already Paid</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This invoice has already been paid on{' '}
              {new Date(invoiceData.invoice.paidAt).toLocaleDateString()}.
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice Number:</span>
                <span className="font-medium">{invoiceData.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">${parseFloat(invoiceData.invoice.totalAmount).toFixed(2)}</span>
              </div>
            </div>
            {user && (
              <Button 
                onClick={() => setLocation('/passenger')} 
                className="w-full"
                data-testid="button-go-dashboard"
              >
                Go to Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
            Pay Invoice
          </h1>
          <p className="text-muted-foreground">
            Complete your payment for booking #{invoiceData.booking.id.toUpperCase().substring(0, 8)}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Invoice Details - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            <Card data-testid="invoice-details">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Invoice Details</span>
                  <Badge variant="outline" data-testid="invoice-number">
                    {invoiceData.invoice.invoiceNumber}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Journey Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">Journey Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 mt-1 text-green-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Pickup Location</p>
                        <p className="font-medium" data-testid="pickup-address">{invoiceData.booking.pickupAddress}</p>
                      </div>
                    </div>

                    {invoiceData.booking.destinationAddress && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 mt-1 text-red-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Destination</p>
                          <p className="font-medium" data-testid="dropoff-address">{invoiceData.booking.destinationAddress}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 mt-1 text-blue-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Scheduled Date & Time</p>
                        <p className="font-medium" data-testid="scheduled-datetime">
                          {new Date(invoiceData.booking.scheduledDateTime).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {invoiceData.booking.requestedHours && (
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 mt-1 text-purple-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-medium">{invoiceData.booking.requestedHours} hours</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Passenger Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">Passenger Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium" data-testid="passenger-name">
                        {invoiceData.passenger.firstName} {invoiceData.passenger.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium" data-testid="passenger-email">{invoiceData.passenger.email}</p>
                    </div>
                    {invoiceData.passenger.phone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{invoiceData.passenger.phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Passengers</p>
                      <p className="font-medium">{invoiceData.booking.passengerCount}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Fare Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">Fare Breakdown</h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Journey Fare</span>
                      <span className="font-medium">${parseFloat(invoiceData.invoice.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${parseFloat(invoiceData.invoice.subtotal).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-primary" data-testid="total-amount">
                        ${parseFloat(invoiceData.invoice.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form - 2 columns */}
          <div className="lg:col-span-2">
            <Card className="sticky top-6" data-testid="payment-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Logged in as <span className="font-medium">{user.email}</span>
                    </p>
                  </div>
                )}

                <PaymentFormWrapper token={token!} invoiceData={invoiceData} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
