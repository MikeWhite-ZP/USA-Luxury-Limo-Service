import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Plus, Trash2, Clock, Banknote, Info, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PaymentOptionsResponse {
  options: Array<{
    id: string;
    optionType: string;
    displayName: string;
    description: string | null;
    isEnabled: boolean;
    sortOrder: number;
  }>;
  paymentSystems: Array<{
    provider: string;
    isActive: boolean;
    hasCredentials: boolean;
  }>;
  activeProvider: string | null;
}

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string | null;
}

interface RideCreditsResponse {
  balance: string;
  hasCredits: boolean;
}

interface RideCreditTransaction {
  id: string;
  type: string;
  amount: string;
  description: string | null;
  createdAt: string;
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
      <div className="p-4 border rounded-lg bg-[#ffffff]">
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
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full bg-blue-600 hover:bg-blue-700"
        data-testid="button-add-card"
      >
        {isProcessing ? 'Adding...' : 'Add Card'}
      </Button>
    </form>
  );
}

export default function MobilePaymentMethods() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  // Fetch payment options (admin-controlled availability)
  const { data: paymentOptionsData, isLoading: paymentOptionsLoading } = useQuery<PaymentOptionsResponse>({
    queryKey: ['/api/payment-options'],
    retry: false,
  });

  // Fetch payment methods
  const { data: paymentData, isLoading: paymentMethodsLoading } = useQuery<PaymentMethodsResponse>({
    queryKey: ['/api/payment-methods'],
    retry: false,
    enabled: !!paymentOptionsData?.options?.find(o => o.optionType === 'credit_card' && o.isEnabled),
  });

  // Fetch ride credits balance
  const { data: rideCredits } = useQuery<RideCreditsResponse>({
    queryKey: ['/api/ride-credits'],
    retry: false,
  });

  // Fetch ride credit transactions (lazy load when expanded)
  const { data: creditTransactions, isLoading: transactionsLoading } = useQuery<RideCreditTransaction[]>({
    queryKey: ['/api/ride-credits/transactions'],
    retry: false,
    enabled: showTransactions,
  });
  
  const isLoading = paymentOptionsLoading || paymentMethodsLoading;

  const paymentMethods = paymentData?.paymentMethods || [];
  const defaultPaymentMethodId = paymentData?.defaultPaymentMethodId || null;

  // Remove payment method mutation
  const removePaymentMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest('DELETE', `/api/payment-methods/${paymentMethodId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Card Removed",
        description: "Payment method has been removed successfully",
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

  // Set default payment method mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest('PATCH', `/api/payment-methods/${paymentMethodId}/default`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Default Card Updated",
        description: "This card is now your default payment method",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set default payment method",
        variant: "destructive",
      });
    },
  });

  const getBrandColor = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return 'bg-blue-600';
      case 'mastercard': return 'bg-red-600';
      case 'amex': return 'bg-green-600';
      case 'discover': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const getBrandName = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  // Extract payment option availability from admin settings
  const creditCardOption = paymentOptionsData?.options?.find(o => o.optionType === 'credit_card');
  const payLaterOption = paymentOptionsData?.options?.find(o => o.optionType === 'pay_later');
  const cashOption = paymentOptionsData?.options?.find(o => o.optionType === 'cash');
  
  const isCreditCardEnabled = creditCardOption?.isEnabled ?? false;
  const isPayLaterEnabled = payLaterOption?.isEnabled ?? false;
  const isCashEnabled = cashOption?.isEnabled ?? false;

  // Card management is available when admin enabled credit_card AND Stripe public key is configured
  // Note: stripePromise checks for VITE_STRIPE_PUBLIC_KEY at build time
  const canManageCreditCards = isCreditCardEnabled && stripePromise;

  // Show alternative payment options page when:
  // 1. Credit card is disabled by admin, OR
  // 2. Stripe public key is not configured (stripePromise is null)
  if (!canManageCreditCards) {
    const enabledOptions = [];
    // Pay Later is available when admin enabled it
    if (isPayLaterEnabled) {
      enabledOptions.push({ icon: Clock, label: 'Pay Later', description: 'Pay after your ride' });
    }
    // Cash is available when admin enabled it (no provider required)
    if (isCashEnabled) {
      enabledOptions.push({ icon: Banknote, label: 'Cash', description: 'Pay with cash to driver' });
    }

    // Determine the reason credit cards aren't available and provide appropriate guidance
    const isStripeSetupIssue = isCreditCardEnabled && !stripePromise;
    const creditCardUnavailableTitle = isStripeSetupIssue
      ? "Credit Card Setup In Progress"
      : "Credit Card Payments Unavailable";
    const creditCardUnavailableReason = isStripeSetupIssue
      ? "Online credit card payments are being configured. Please check back later or use one of the payment options below."
      : "Credit card payments are not currently offered. Please select from the available payment options below.";

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b-2 border-blue-100 p-6 pb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/mobile-passenger')}
              className="text-blue-700 hover:bg-blue-50"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Payment Options</h1>
              <p className="text-slate-600 text-sm mt-0.5">Available payment methods</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Credit Card Unavailable Message */}
          <Card className={`border-2 shadow-sm ${isStripeSetupIssue ? 'border-blue-100 bg-blue-50' : 'border-amber-100 bg-amber-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isStripeSetupIssue ? 'bg-blue-100' : 'bg-amber-100'}`}>
                  <Info className={`w-5 h-5 ${isStripeSetupIssue ? 'text-blue-600' : 'text-amber-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isStripeSetupIssue ? 'text-blue-900' : 'text-amber-900'}`}>
                    {creditCardUnavailableTitle}
                  </h3>
                  <p className={`text-sm mt-1 ${isStripeSetupIssue ? 'text-blue-700' : 'text-amber-700'}`}>
                    {creditCardUnavailableReason}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Payment Methods */}
          {enabledOptions.length > 0 ? (
            <>
              <h2 className="text-lg font-semibold text-slate-700 mt-6 mb-3">Available Payment Methods</h2>
              {enabledOptions.map((option, index) => (
                <Card key={index} className="border-2 border-green-100 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <option.icon className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{option.label}</h3>
                        <p className="text-sm text-slate-600">{option.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card className="text-center p-8 border-2 border-slate-200 shadow-sm bg-white">
              <CardContent className="pt-6">
                <div className="bg-slate-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Payment Methods Available</h3>
                <p className="text-slate-500">
                  Payment options are currently unavailable. Please contact support for assistance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b-2 border-blue-100 p-6 pb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/mobile-passenger')}
            className="text-blue-700 hover:bg-blue-50"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={() => setAddPaymentOpen(true)}
            className="text-blue-700 hover:bg-blue-50"
            data-testid="button-add-payment-method"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Card
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2.5 rounded-xl">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Payment Methods</h1>
            <p className="text-slate-600 text-sm mt-0.5">Manage your credit cards</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {!paymentMethods || paymentMethods.length === 0 ? (
          <Card className="text-center p-8 border-2 border-blue-100 shadow-sm bg-white">
            <CardContent className="pt-6">
              <div className="bg-blue-50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Payment Methods</h3>
              <p className="text-slate-500 mb-4">
                Add a credit card to make bookings easier and faster.
              </p>
              <Button
                onClick={() => setAddPaymentOpen(true)}
                className="bg-white hover:bg-blue-50 text-blue-700 border-2 border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all"
                data-testid="button-add-first-card"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          paymentMethods.map((pm) => {
            const isDefault = pm.id === defaultPaymentMethodId;
            
            return (
              <Card key={pm.id} className={`overflow-hidden border-2 shadow-sm bg-white ${isDefault ? 'border-blue-300' : 'border-slate-200'}`} data-testid={`card-${pm.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 ${getBrandColor(pm.card.brand)} rounded-lg text-white text-xs flex items-center justify-center font-bold shadow-sm`}>
                        {pm.card.brand.toUpperCase().slice(0, 4)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900" data-testid={`card-brand-${pm.id}`}>
                            {getBrandName(pm.card.brand)} •••• {pm.card.last4}
                          </p>
                          {isDefault && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs border border-blue-200" data-testid={`badge-default-${pm.id}`}>
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          Expires {pm.card.exp_month.toString().padStart(2, '0')}/{pm.card.exp_year.toString().slice(-2)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePaymentMutation.mutate(pm.id)}
                      disabled={removePaymentMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`button-remove-${pm.id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {!isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(pm.id)}
                      disabled={setDefaultMutation.isPending}
                      className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                      data-testid={`button-set-default-${pm.id}`}
                    >
                      Set as Default
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Ride Credits Section */}
      <div className="px-6 pb-4 space-y-3">
        <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
          <span className="bg-emerald-100 p-1.5 rounded-lg">
            <Wallet className="w-4 h-4 text-emerald-600" />
          </span>
          Ride Credits
        </h2>
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <Wallet className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Available Balance</h3>
                  <p className="text-sm text-slate-600">Use for future bookings</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-600">
                  ${rideCredits?.balance || '0.00'}
                </p>
              </div>
            </div>
            
            {rideCredits?.hasCredits && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTransactions(!showTransactions)}
                className="w-full text-emerald-700 hover:bg-emerald-100 mt-2"
                data-testid="button-toggle-transactions"
              >
                {showTransactions ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Hide Transaction History
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    View Transaction History
                  </>
                )}
              </Button>
            )}
            
            {showTransactions && (
              <div className="mt-3 pt-3 border-t border-emerald-200 space-y-2">
                {transactionsLoading ? (
                  <div className="text-center py-3 text-slate-500 text-sm">Loading...</div>
                ) : creditTransactions && creditTransactions.length > 0 ? (
                  creditTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center py-2 border-b border-emerald-100 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {tx.type === 'credit' ? 'Credit Added' : 'Credit Used'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {tx.description || 'No description'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}${tx.amount}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-3 text-slate-500 text-sm">No transactions yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="bg-emerald-50 rounded-lg p-3 text-sm text-emerald-700">
          <p>
            <strong>How credits work:</strong> Ride credits are earned when you cancel a booking more than 2 hours before pickup. They can be used for future bookings.
          </p>
        </div>
      </div>

      {/* Other Payment Options Section */}
      {(isPayLaterEnabled || isCashEnabled) && (
        <div className="px-6 pb-6 space-y-3">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <span className="bg-slate-100 p-1.5 rounded-lg">
              <Banknote className="w-4 h-4 text-slate-600" />
            </span>
            Other Payment Options
          </h2>
          <div className="space-y-3">
            {isPayLaterEnabled && (
              <Card className="border-2 border-amber-100 bg-amber-50/50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Pay Later</h3>
                      <p className="text-sm text-slate-600">Pay after your ride is completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {isCashEnabled && (
              <Card className="border-2 border-green-100 bg-green-50/50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Banknote className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Cash</h3>
                      <p className="text-sm text-slate-600">Pay with cash to your driver</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Add Payment Method Dialog */}
      <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
        <DialogContent className="max-w-md bg-[#ffffff]" data-testid="dialog-add-payment">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Enter your card details securely. We use Stripe to protect your payment information.
            </DialogDescription>
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
    </div>
  );
}
