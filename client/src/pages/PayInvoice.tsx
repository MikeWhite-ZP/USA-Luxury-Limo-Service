import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, CreditCard, MapPin, Clock, AlertCircle, Loader2 } from "lucide-react";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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
    dropoffAddress?: string;
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

const PaymentForm = ({ token, invoiceData }: { token: string; invoiceData: InvoiceData }) => {
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
        toast({
          title: "Payment Successful!",
          description: "Your invoice has been paid successfully.",
        });
        
        // Redirect to success page or passenger dashboard
        if (user) {
          setLocation('/passenger?payment=success');
        } else {
          setLocation(`/pay/${token}/success`);
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
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </form>
  );
};

const PaymentFormWrapper = ({ token, invoiceData }: { token: string; invoiceData: InvoiceData }) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest('POST', '/api/payment-intents/invoice', {
          token,
          invoiceId: invoiceData.invoice.id,
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
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

  if (!clientSecret) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">Failed to initialize payment</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm token={token} invoiceData={invoiceData} />
    </Elements>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
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

                    {invoiceData.booking.dropoffAddress && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 mt-1 text-red-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Destination</p>
                          <p className="font-medium" data-testid="dropoff-address">{invoiceData.booking.dropoffAddress}</p>
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
