import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Plus, Trash2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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

  // Fetch payment methods
  const { data: paymentData, isLoading } = useQuery<PaymentMethodsResponse>({
    queryKey: ['/api/payment-methods'],
    retry: false,
  });

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

  // Check if Stripe is configured
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/mobile-passenger')}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Payment Setup Required</h3>
            <p className="text-gray-500">
              Payment method management is not available. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/mobile-passenger')}
            className="text-white hover:bg-green-500/20"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={() => setAddPaymentOpen(true)}
            className="text-white hover:bg-green-500/20"
            data-testid="button-add-payment-method"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Card
          </Button>
        </div>
        <h1 className="text-2xl font-bold flex items-center">
          <CreditCard className="w-6 h-6 mr-2" />
          Payment Methods
        </h1>
        <p className="text-green-100 mt-1">Manage your credit cards</p>
      </div>

      <div className="p-6 space-y-4">
        {!paymentMethods || paymentMethods.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent className="pt-6">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payment Methods</h3>
              <p className="text-gray-500 mb-4">
                Add a credit card to make bookings easier and faster.
              </p>
              <Button
                onClick={() => setAddPaymentOpen(true)}
                className="bg-green-600 hover:bg-green-700"
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
              <Card key={pm.id} className={`overflow-hidden ${isDefault ? 'ring-2 ring-green-500' : ''}`} data-testid={`card-${pm.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 ${getBrandColor(pm.card.brand)} rounded-lg text-white text-xs flex items-center justify-center font-bold shadow-md`}>
                        {pm.card.brand.toUpperCase().slice(0, 4)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900" data-testid={`card-brand-${pm.id}`}>
                            {getBrandName(pm.card.brand)} •••• {pm.card.last4}
                          </p>
                          {isDefault && (
                            <Badge className="bg-green-100 text-green-800 text-xs" data-testid={`badge-default-${pm.id}`}>
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
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
                      className="w-full border-green-600 text-green-600 hover:bg-green-50"
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
