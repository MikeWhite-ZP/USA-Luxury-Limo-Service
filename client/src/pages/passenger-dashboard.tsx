import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/useBranding";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Building, MapPin, Plus, Trash2, CreditCard, Star, Edit, Edit2, AlertTriangle, Calendar, History, HelpCircle, Send, User, Save, Mail, Phone, FileText, Eye, Printer, ChevronDown, Building2, Plane, Hotel, Utensils, ShoppingBag, Car, Coffee, Hospital, School, Landmark, Download, CheckCircle2, DollarSign } from "lucide-react";
import { Elements, CardElement, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema } from "@shared/schema";
import type { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import BookingForm from "@/components/BookingForm";
import EditBookingDialog from "@/components/EditBookingDialog";
import { Clock, Info } from "lucide-react";

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

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
  status: 'pending' | 'pending_driver_acceptance' | 'confirmed' | 'on_the_way' | 'arrived' | 'on_board' | 'in_progress' | 'completed' | 'cancelled';
  pickupAddress: string;
  pickupLat?: string;
  pickupLon?: string;
  destinationAddress?: string;
  destinationLat?: string;
  destinationLon?: string;
  scheduledDateTime: string;
  totalAmount: string;
  createdAt: string;
  driverId?: string;
  driverFirstName?: string;
  driverLastName?: string;
  driverPhone?: string;
  driverCredentials?: string;
  driverProfileImageUrl?: string;
  driverVehiclePlate?: string;
  vehicleTypeId?: string;
  vehicleTypeName?: string;
  passengerCount?: number;
  luggageCount?: number;
  requestedHours?: number;
  specialInstructions?: string;
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  bookingFor?: 'self' | 'someone_else';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
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
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full btn-brand-primary">
        {isProcessing ? 'Adding...' : 'Add Payment Method'}
      </Button>
    </form>
  );
}

function PaymentMethodsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  const { data, isLoading } = useQuery<PaymentMethodsResponse>({
    queryKey: ['/api/payment-methods'],
    retry: false,
  });

  const paymentMethods = data?.paymentMethods || [];

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

  // Check if Stripe is configured
  if (!stripePromise) {
    return (
      <div className="text-center p-8 border border-dashed border-border rounded-lg" data-testid="stripe-not-configured">
        <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">Payment methods not available</p>
        <p className="text-sm text-muted-foreground">
          Stripe integration needs to be configured to manage payment methods.
        </p>
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
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-md bg-[#ffffff]">
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

function InvoicesList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { companyName, logoUrl, isFetched: isBrandingFetched } = useBranding();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<any>(null);
  const [pendingPrintInvoice, setPendingPrintInvoice] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'square' | null>(null);
  const [squareConfig, setSquareConfig] = useState<{
    applicationId: string;
    locationId: string;
    environment: string;
  } | null>(null);

  // Effect to handle printing when branding is ready
  useEffect(() => {
    if (pendingPrintInvoice && isBrandingFetched) {
      setPrintInvoice(pendingPrintInvoice);
      setPendingPrintInvoice(null);
      setTimeout(() => {
        window.print();
        setPrintInvoice(null);
      }, 100);
    }
  }, [pendingPrintInvoice, isBrandingFetched]);

  // Fetch passenger invoices
  const { data: invoices, isLoading } = useQuery<any[]>({
    queryKey: ['/api/passenger/invoices'],
  });

  // Create payment intent mutation (handles both Stripe and Square)
  const createPaymentIntentMutation = useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: string }) => {
      const response = await fetch(`/api/passenger/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPaymentProvider(data.provider);
      if (data.provider === 'stripe') {
        setClientSecret(data.clientSecret);
        setSquareConfig(null);
      } else if (data.provider === 'square') {
        setClientSecret(null);
        setSquareConfig({
          applicationId: data.applicationId,
          locationId: data.locationId,
          environment: data.environment,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
      setPaymentDialogOpen(false);
      setPaymentInvoice(null);
      setPaymentProvider(null);
      setSquareConfig(null);
    },
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentIntentId }: { invoiceId: string; paymentIntentId: string }) => {
      const response = await fetch(`/api/passenger/invoices/${invoiceId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentIntentId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm payment');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Payment Successful',
        description: 'Your invoice has been paid successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/passenger/invoices'] });
      setPaymentDialogOpen(false);
      setPaymentInvoice(null);
      setClientSecret(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to confirm payment',
        variant: 'destructive',
      });
    },
  });

  const handlePay = (invoice: any) => {
    setPaymentInvoice(invoice);
    setPaymentDialogOpen(true);
    createPaymentIntentMutation.mutate({ invoiceId: invoice.id });
  };

  const canPayInvoice = (invoice: any) => {
    // Can pay if: unpaid AND booking is not cancelled
    return !invoice.paidAt && invoice.booking?.status !== 'cancelled' && parseFloat(invoice.totalAmount) > 0;
  };

  // Email invoice mutation
  const emailInvoiceMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await fetch(`/api/passenger/invoices/${id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Email Sent',
        description: 'Invoice has been sent to your email address',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invoice email',
        variant: 'destructive',
      });
    },
  });

  const handleView = (invoice: any) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleEmail = (invoice: any) => {
    setIsLoadingEmail(true);
    emailInvoiceMutation.mutate(
      { id: invoice.id },
      {
        onSettled: () => {
          setIsLoadingEmail(false);
        },
      }
    );
  };

  const handlePrint = async (invoice: any) => {
    // If branding is already fetched, print immediately
    if (isBrandingFetched) {
      setPrintInvoice(invoice);
      setTimeout(() => {
        window.print();
        setPrintInvoice(null);
      }, 100);
    } else {
      // Otherwise, store the pending invoice and wait for branding to load
      setPendingPrintInvoice(invoice);
    }
  };

  const renderPrintableInvoice = (invoice: any) => {
    if (!invoice) return null;
    const booking = invoice.booking;
    
    return (
      <div className="print-only-content">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-only-content,
            .print-only-content * {
              visibility: visible;
            }
            .print-only-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
          .print-only-content {
            display: none;
          }
          @media print {
            @page {
              size: letter;
              margin: 0.4in;
            }
            .print-only-content {
              display: block !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              padding: 0;
              max-width: 100%;
              margin: 0 auto;
              background: #ffffff;
              color: #0f172a;
              line-height: 1.3;
              font-size: 10pt;
            }
            .print-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #f59e0b;
              padding: 12px;
              margin-bottom: 12px;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 6px;
              page-break-inside: avoid;
            }
            .print-header-left {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .print-header-logo {
              max-width: 100px;
              max-height: 60px;
              object-fit: contain;
            }
            .print-header h1 {
              font-size: 20pt;
              font-weight: 800;
              color: #1e293b;
              margin-bottom: 2px;
            }
            .print-header-right {
              text-align: right;
            }
            .print-invoice-number {
              font-size: 11pt;
              color: #f59e0b;
              font-weight: 600;
              margin-top: 4px;
            }
            .print-info-section {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 5px;
              padding: 10px;
              margin-bottom: 10px;
              page-break-inside: avoid;
            }
            .print-info-section h2 {
              font-size: 10pt;
              font-weight: 700;
              color: #334155;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .print-info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 6px 12px;
            }
            .print-info-item {
              display: flex;
              flex-direction: column;
            }
            .print-info-label {
              font-size: 8pt;
              color: #64748b;
              font-weight: 500;
              margin-bottom: 1px;
            }
            .print-info-value {
              font-size: 9pt;
              color: #0f172a;
              font-weight: 600;
            }
            .print-pricing-section {
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 5px;
              padding: 10px;
              margin-bottom: 10px;
              page-break-inside: avoid;
            }
            .print-pricing-section h2 {
              font-size: 10pt;
              font-weight: 700;
              color: #334155;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .print-pricing-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px solid #f1f5f9;
            }
            .print-pricing-row:last-child {
              border-bottom: none;
            }
            .print-pricing-label {
              font-size: 9pt;
              color: #0f172a;
              font-weight: 500;
            }
            .print-pricing-value {
              font-size: 9pt;
              color: #0f172a;
              font-weight: 600;
            }
            .print-pricing-surge {
              color: #ea580c;
            }
            .print-pricing-discount {
              color: #16a34a;
            }
            .print-total-section {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 2px solid #f59e0b;
              border-radius: 5px;
              padding: 10px;
              margin-top: 8px;
            }
            .print-total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .print-total-label {
              font-size: 12pt;
              color: #0f172a;
              font-weight: 700;
            }
            .print-total-value {
              font-size: 16pt;
              color: #f59e0b;
              font-weight: 800;
            }
            .print-payment-status {
              text-align: center;
              margin-top: 10px;
              padding: 8px;
              background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
              border: 2px solid #10b981;
              border-radius: 5px;
            }
            .print-payment-status-text {
              color: #065f46;
              font-weight: 800;
              font-size: 11pt;
            }
            .print-footer {
              margin-top: 12px;
              padding-top: 8px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
            }
            .print-footer p {
              color: #64748b;
              font-size: 8pt;
              font-weight: 500;
            }
            .print-footer .thank-you {
              font-size: 10pt;
              font-weight: 600;
              color: #334155;
              margin-bottom: 2px;
            }
          }
        `}</style>
        <div className="print-header">
          <div className="print-header-left">
            {logoUrl && <img src={logoUrl} alt={companyName} className="print-header-logo" />}
            <h1>{companyName}</h1>
          </div>
          <div className="print-header-right">
            <div className="print-invoice-number">Invoice #{invoice.invoiceNumber}</div>
          </div>
        </div>
        
        <div className="print-info-section">
          <h2>Invoice Information</h2>
          <div className="print-info-grid">
            <div className="print-info-item">
              <span className="print-info-label">Invoice Date</span>
              <span className="print-info-value">
                {new Date(invoice.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="print-info-item">
              <span className="print-info-label">Booking ID</span>
              <span className="print-info-value">#{invoice.bookingId.toUpperCase().substring(0, 8)}</span>
            </div>
            {booking?.billReference && (
              <div className="print-info-item">
                <span className="print-info-label">Bill Reference</span>
                <span className="print-info-value">{booking.billReference}</span>
              </div>
            )}
            {booking?.bookingFor === 'someone_else' ? (
              <>
                <div className="print-info-item">
                  <span className="print-info-label">Booked By</span>
                  <span className="print-info-value">
                    {(booking.passengerFirstName || '') + ' ' + (booking.passengerLastName || '') || 'N/A'}
                  </span>
                </div>
                <div className="print-info-item">
                  <span className="print-info-label">Passenger</span>
                  <span className="print-info-value">{booking.passengerName || 'N/A'}</span>
                </div>
              </>
            ) : booking ? (
              <div className="print-info-item">
                <span className="print-info-label">Passenger</span>
                <span className="print-info-value">
                  {booking.passengerName || ((booking.passengerFirstName || '') + ' ' + (booking.passengerLastName || '')) || 'N/A'}
                </span>
              </div>
            ) : null}
            {invoice.paidAt && (
              <div className="print-info-item">
                <span className="print-info-label">Payment Date</span>
                <span className="print-info-value">
                  {new Date(invoice.paidAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {booking && (
          <div className="print-info-section">
            <h2>🚗 Journey Information</h2>
            <div className="print-info-grid">
              <div className="print-info-item" style={{ gridColumn: 'span 2' }}>
                <span className="print-info-label">Pickup Location:</span>
                <span className="print-info-value">{booking.pickupAddress}</span>
              </div>
              {booking.bookingType === 'hourly' && booking.requestedHours ? (
                <div className="print-info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="print-info-label">Duration:</span>
                  <span className="print-info-value">
                    {booking.requestedHours} {booking.requestedHours === 1 ? 'Hour' : 'Hours'}
                  </span>
                </div>
              ) : booking.destinationAddress ? (
                <div className="print-info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="print-info-label">Destination:</span>
                  <span className="print-info-value">{booking.destinationAddress}</span>
                </div>
              ) : null}
            </div>
          </div>
        )}
        
        <div className="print-pricing-section">
          <h2>📋 Detailed Pricing Breakdown</h2>
          {booking?.baseFare && (
            <div className="print-pricing-row">
              <span className="print-pricing-label">Base Fare</span>
              <span className="print-pricing-value">${parseFloat(booking.baseFare).toFixed(2)}</span>
            </div>
          )}
          {booking?.surgePricingAmount && parseFloat(booking.surgePricingAmount) > 0 && (
            <div className="print-pricing-row">
              <span className="print-pricing-label">
                Surge Pricing{booking.surgePricingMultiplier ? ` (${booking.surgePricingMultiplier}x)` : ''}
              </span>
              <span className="print-pricing-value print-pricing-surge">
                +${parseFloat(booking.surgePricingAmount).toFixed(2)}
              </span>
            </div>
          )}
          {booking?.gratuityAmount && parseFloat(booking.gratuityAmount) > 0 && (
            <div className="print-pricing-row">
              <span className="print-pricing-label">Gratuity (Tip)</span>
              <span className="print-pricing-value">+${parseFloat(booking.gratuityAmount).toFixed(2)}</span>
            </div>
          )}
          {booking?.airportFeeAmount && parseFloat(booking.airportFeeAmount) > 0 && (
            <div className="print-pricing-row">
              <span className="print-pricing-label">Airport Fee</span>
              <span className="print-pricing-value">+${parseFloat(booking.airportFeeAmount).toFixed(2)}</span>
            </div>
          )}
          {booking?.discountAmount && parseFloat(booking.discountAmount) > 0 && (
            <div className="print-pricing-row">
              <span className="print-pricing-label">
                Discount{booking.discountPercentage ? ` (${booking.discountPercentage}%)` : ''}
              </span>
              <span className="print-pricing-value print-pricing-discount">
                -${parseFloat(booking.discountAmount).toFixed(2)}
              </span>
            </div>
          )}
          {!booking?.baseFare && (
            <div className="print-pricing-row">
              <span className="print-pricing-label">Journey Fare</span>
              <span className="print-pricing-value">${parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
          )}
          
          <div className="print-total-section">
            <div className="print-total-row">
              <span className="print-total-label">Total Amount</span>
              <span className="print-total-value">${parseFloat(invoice.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {invoice.paidAt && (
          <div className="print-payment-status">
            <div className="print-payment-status-text">✓ PAYMENT RECEIVED</div>
          </div>
        )}
        
        <div className="print-footer">
          <p className="thank-you">Thank you for choosing {companyName}!</p>
          <p>All prices include statutory taxes and transportation expenses</p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-8" data-testid="no-invoices">
        <div className="w-10 h-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
          <FileText className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">No invoices found</p>
        <p className="text-muted-foreground text-xs mt-1">Invoices appear after completed rides</p>
      </div>
    );
  }

  return (
    <>
      {printInvoice && renderPrintableInvoice(printInvoice)}
      <div className="divide-y divide-border">
        {invoices
          .filter(invoice => !(invoice.booking?.status === 'cancelled' && !invoice.paidAt))
          .map((invoice, index) => (
          <div
            key={invoice.id}
            className={`py-3 ${index === 0 ? '' : ''}`}
            data-testid={`invoice-${invoice.id}`}
          >
            {/* Compact invoice row */}
            <div className="flex items-center justify-between gap-3">
              {/* Left: Invoice info - clickable to view details */}
              <button
                onClick={() => handleView(invoice)}
                className="flex-1 min-w-0 text-left hover:bg-muted/50 rounded p-1 -m-1 transition-colors"
                title="View invoice details"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-brand-accent hover:underline" data-testid={`invoice-number-${invoice.id}`}>
                    {invoice.invoiceNumber}
                  </span>
                  <span className="text-xs text-muted-foreground" data-testid={`invoice-date-${invoice.id}`}>
                    {new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {invoice.booking && (
                  <p className="text-xs text-muted-foreground truncate" title={invoice.booking.pickupAddress}>
                    {invoice.booking.pickupAddress?.substring(0, 50)}{invoice.booking.pickupAddress?.length > 50 ? '...' : ''}
                    {invoice.booking.destinationAddress && (
                      <span className="text-brand-accent"> → </span>
                    )}
                    {invoice.booking.destinationAddress?.substring(0, 30)}{invoice.booking.destinationAddress?.length > 30 ? '...' : ''}
                  </p>
                )}
              </button>
              
              {/* Center: Amount & Status */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-sm text-brand-accent" data-testid={`invoice-amount-${invoice.id}`}>
                  ${parseFloat(invoice.totalAmount).toFixed(2)}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    invoice.paidAt
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                  data-testid={`invoice-status-${invoice.id}`}
                >
                  {invoice.paidAt ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              
              {/* Right: Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Pay Now button - only for unpaid non-cancelled bookings */}
                {canPayInvoice(invoice) && (
                  <button
                    onClick={() => handlePay(invoice)}
                    className="px-2 py-1 rounded text-xs font-medium btn-brand-primary text-white transition-colors"
                    title="Pay Now"
                    data-testid={`button-pay-${invoice.id}`}
                  >
                    Pay
                  </button>
                )}
                {/* Print/Email disabled for unpaid cancelled bookings */}
                {(() => {
                  const isUnpaidCancelled = !invoice.paidAt && invoice.booking?.status === 'cancelled';
                  return (
                    <>
                      <button
                        onClick={() => !isUnpaidCancelled && handlePrint(invoice)}
                        disabled={isUnpaidCancelled}
                        className={`p-1.5 rounded transition-colors ${
                          isUnpaidCancelled 
                            ? 'text-muted-foreground/40 cursor-not-allowed' 
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                        title={isUnpaidCancelled ? "Cannot print cancelled unpaid invoice" : "Print Invoice"}
                        data-testid={`button-print-${invoice.id}`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => !isUnpaidCancelled && handleEmail(invoice)}
                        disabled={isLoadingEmail || isUnpaidCancelled}
                        className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                          isUnpaidCancelled 
                            ? 'text-muted-foreground/40 cursor-not-allowed' 
                            : 'hover:bg-muted text-muted-foreground hover:text-brand-accent'
                        }`}
                        title={isUnpaidCancelled ? "Cannot email cancelled unpaid invoice" : "Email Invoice"}
                        data-testid={`button-email-${invoice.id}`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Dialog - Compact Professional */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card p-4">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-semibold text-foreground">Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg border border-border">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-medium">Invoice #</p>
                    <p className="font-semibold text-foreground text-sm" data-testid="view-invoice-number">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-medium">Date</p>
                    <p className="text-foreground text-sm" data-testid="view-invoice-date">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-brand-light border-brand rounded-lg">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-medium">Total</p>
                  <p className="text-xl font-bold text-brand-accent" data-testid="view-total-amount">
                    ${parseFloat(selectedInvoice.totalAmount).toFixed(2)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${selectedInvoice.paidAt ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {selectedInvoice.paidAt ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setPaymentDialogOpen(false);
          setPaymentInvoice(null);
          setClientSecret(null);
          setPaymentProvider(null);
          setSquareConfig(null);
        }
      }}>
        <DialogContent className="sm:max-w-[450px] bg-card p-5">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold text-foreground">Pay Invoice</DialogTitle>
            {paymentInvoice && (
              <p className="text-sm text-muted-foreground">
                {paymentInvoice.invoiceNumber} - ${parseFloat(paymentInvoice.totalAmount).toFixed(2)}
              </p>
            )}
          </DialogHeader>
          
          {createPaymentIntentMutation.isPending ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full" />
              <span className="ml-3 text-sm text-muted-foreground">Preparing payment...</span>
            </div>
          ) : paymentProvider === 'stripe' && clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <InvoicePaymentForm 
                invoiceId={paymentInvoice?.id}
                amount={paymentInvoice?.totalAmount}
                onSuccess={(paymentIntentId) => {
                  confirmPaymentMutation.mutate({ 
                    invoiceId: paymentInvoice?.id, 
                    paymentIntentId 
                  });
                }}
                onCancel={() => {
                  setPaymentDialogOpen(false);
                  setPaymentInvoice(null);
                  setClientSecret(null);
                  setPaymentProvider(null);
                }}
              />
            </Elements>
          ) : paymentProvider === 'square' && squareConfig ? (
            <SquareInvoicePaymentForm 
              invoiceId={paymentInvoice?.id}
              amount={paymentInvoice?.totalAmount}
              applicationId={squareConfig.applicationId}
              locationId={squareConfig.locationId}
              environment={squareConfig.environment}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/passenger/invoices'] });
                setPaymentDialogOpen(false);
                setPaymentInvoice(null);
                setSquareConfig(null);
                setPaymentProvider(null);
              }}
              onCancel={() => {
                setPaymentDialogOpen(false);
                setPaymentInvoice(null);
                setSquareConfig(null);
                setPaymentProvider(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function OldInvoicesList() {
  const { data: oldInvoices, isLoading } = useQuery<any[]>({
    queryKey: ['/api/old-invoices'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!oldInvoices || oldInvoices.length === 0) {
    return (
      <div className="text-center py-8" data-testid="no-old-invoices">
        <div className="w-10 h-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
          <FileText className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">No old invoices</p>
        <p className="text-muted-foreground text-xs mt-1">Historical invoices uploaded by admin will appear here</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {oldInvoices.map((oldInvoice, index) => (
        <div
          key={oldInvoice.id}
          className={`py-3`}
          data-testid={`old-invoice-${oldInvoice.id}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm text-brand-accent" data-testid={`old-invoice-name-${oldInvoice.id}`}>
                  {oldInvoice.fileName}
                </span>
                <span className="text-xs text-muted-foreground" data-testid={`old-invoice-date-${oldInvoice.id}`}>
                  {oldInvoice.invoiceDate 
                    ? new Date(oldInvoice.invoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : new Date(oldInvoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {oldInvoice.description && (
                <p className="text-xs text-muted-foreground truncate" title={oldInvoice.description}>
                  {oldInvoice.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {oldInvoice.fileSize && (
                <span className="text-xs text-muted-foreground">
                  {(oldInvoice.fileSize / 1024).toFixed(0)} KB
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  if (oldInvoice.downloadUrl) {
                    window.open(oldInvoice.downloadUrl, '_blank');
                  }
                }}
                className="p-1.5 rounded transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Download Invoice"
                data-testid={`button-download-${oldInvoice.id}`}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (oldInvoice.downloadUrl) {
                    const printWindow = window.open(oldInvoice.downloadUrl, '_blank');
                    if (printWindow) {
                      printWindow.onload = () => printWindow.print();
                    }
                  }
                }}
                className="p-1.5 rounded transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Print Invoice"
                data-testid={`button-print-old-${oldInvoice.id}`}
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Stripe Payment Form for Invoice
function InvoicePaymentForm({ 
  invoiceId, 
  amount, 
  onSuccess, 
  onCancel 
}: { 
  invoiceId: string;
  amount: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: submitError.message || 'Please try again',
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted/50 p-3 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground mb-1">Amount to Pay</p>
        <p className="text-2xl font-bold text-brand-accent">${parseFloat(amount).toFixed(2)}</p>
      </div>
      
      <div className="border border-border rounded-lg p-3">
        <PaymentElement />
      </div>
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
      
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 btn-brand-primary"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
}

// Square Payment Form for Invoice
function SquareInvoicePaymentForm({ 
  invoiceId, 
  amount, 
  applicationId,
  locationId,
  environment,
  onSuccess, 
  onCancel 
}: { 
  invoiceId: string;
  amount: string;
  applicationId: string;
  locationId: string;
  environment: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSquareLoaded, setIsSquareLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initAttemptedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const waitForContainer = (): Promise<void> => {
      return new Promise((resolve) => {
        const check = () => {
          if (containerRef.current && document.getElementById('square-card-container-dashboard')) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      });
    };

    const loadSquareSDK = async () => {
      // Wait for container to be in DOM first
      await waitForContainer();
      
      if (!isMounted) return;

      if ((window as any).Square) {
        await initializeSquarePayments();
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="squarecdn.com"]');
      if (existingScript) {
        // Wait for existing script to load
        const waitForSquare = () => {
          if ((window as any).Square) {
            initializeSquarePayments();
          } else {
            setTimeout(waitForSquare, 100);
          }
        };
        waitForSquare();
        return;
      }

      const script = document.createElement('script');
      script.src = environment === 'production' 
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';
      script.async = true;
      script.onload = async () => {
        if (isMounted) {
          await initializeSquarePayments();
        }
      };
      script.onerror = () => {
        if (isMounted) {
          setError('Failed to load payment system. Please try again.');
        }
      };
      document.body.appendChild(script);
    };

    const initializeSquarePayments = async () => {
      if (initAttemptedRef.current || !isMounted) return;
      initAttemptedRef.current = true;
      
      try {
        const Square = (window as any).Square;
        if (!Square) {
          throw new Error('Square SDK not loaded');
        }

        const container = document.getElementById('square-card-container-dashboard');
        if (!container) {
          throw new Error('Payment container not found');
        }

        const payments = Square.payments(applicationId, locationId);
        paymentsRef.current = payments;

        const card = await payments.card();
        await card.attach('#square-card-container-dashboard');
        cardRef.current = card;
        if (isMounted) {
          setIsSquareLoaded(true);
        }
      } catch (err: any) {
        console.error('Square initialization error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to initialize payment form.');
        }
      }
    };

    loadSquareSDK();

    return () => {
      isMounted = false;
      if (cardRef.current) {
        cardRef.current.destroy?.();
      }
    };
  }, [applicationId, locationId, environment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardRef.current || !isSquareLoaded) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const tokenResult = await cardRef.current.tokenize();
      
      if (tokenResult.status === 'OK') {
        const response = await fetch(`/api/passenger/invoices/${invoiceId}/confirm-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sourceId: tokenResult.token,
            provider: 'square',
          }),
        });

        const result = await response.json();

        if (response.ok) {
          toast({
            title: 'Payment Successful',
            description: 'Your invoice has been paid successfully.',
          });
          onSuccess();
        } else {
          setError(result.message || 'Payment failed');
          toast({
            title: 'Payment Failed',
            description: result.message || 'Please try again',
            variant: 'destructive',
          });
        }
      } else {
        const errorMessage = tokenResult.errors?.[0]?.message || 'Failed to process card';
        setError(errorMessage);
        toast({
          title: 'Card Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      toast({
        title: 'Payment Error',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted/50 p-3 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground mb-1">Amount to Pay</p>
        <p className="text-2xl font-bold text-brand-accent">${parseFloat(amount).toFixed(2)}</p>
      </div>
      
      <div className="relative">
        {!isSquareLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
            <div className="animate-spin w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full" />
            <span className="ml-3 text-sm text-muted-foreground">Loading payment form...</span>
          </div>
        )}
        <div className="border border-border rounded-lg p-3">
          <div ref={containerRef} id="square-card-container-dashboard" style={{ minHeight: '89px' }} />
        </div>
      </div>
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
      
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isSquareLoaded || isProcessing}
          className="flex-1 btn-brand-primary"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
}

// Stripe Payment Form for Booking
function BookingPaymentForm({ 
  bookingId, 
  amount, 
  onSuccess, 
  onCancel 
}: { 
  bookingId?: string;
  amount?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: submitError.message || 'Please try again',
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted/50 p-3 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground mb-1">Amount to Pay</p>
        <p className="text-2xl font-bold text-brand-accent">${parseFloat(amount || '0').toFixed(2)}</p>
      </div>
      
      <div className="border border-border rounded-lg p-3">
        <PaymentElement />
      </div>
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
      
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 btn-brand-primary"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
}

// Square Payment Form for Booking
function SquareBookingPaymentForm({ 
  bookingId, 
  amount, 
  applicationId,
  locationId,
  environment,
  onSuccess, 
  onCancel 
}: { 
  bookingId?: string;
  amount?: string;
  applicationId: string;
  locationId: string;
  environment: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSquareLoaded, setIsSquareLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initAttemptedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const waitForContainer = (): Promise<void> => {
      return new Promise((resolve) => {
        const check = () => {
          if (containerRef.current && document.getElementById('square-card-container-booking')) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      });
    };

    const loadSquareSDK = async () => {
      // Wait for container to be in DOM first
      await waitForContainer();
      
      if (!isMounted) return;

      if ((window as any).Square) {
        await initializeSquarePayments();
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="squarecdn.com"]');
      if (existingScript) {
        // Wait for existing script to load
        const waitForSquare = () => {
          if ((window as any).Square) {
            initializeSquarePayments();
          } else {
            setTimeout(waitForSquare, 100);
          }
        };
        waitForSquare();
        return;
      }

      const script = document.createElement('script');
      script.src = environment === 'production' 
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';
      script.async = true;
      script.onload = async () => {
        if (isMounted) {
          await initializeSquarePayments();
        }
      };
      script.onerror = () => {
        if (isMounted) {
          setError('Failed to load payment system. Please try again.');
        }
      };
      document.body.appendChild(script);
    };

    const initializeSquarePayments = async () => {
      if (initAttemptedRef.current || !isMounted) return;
      initAttemptedRef.current = true;
      
      try {
        const Square = (window as any).Square;
        if (!Square) {
          throw new Error('Square SDK not loaded');
        }

        const container = document.getElementById('square-card-container-booking');
        if (!container) {
          throw new Error('Payment container not found');
        }

        const payments = Square.payments(applicationId, locationId);
        paymentsRef.current = payments;

        const card = await payments.card();
        await card.attach('#square-card-container-booking');
        cardRef.current = card;
        if (isMounted) {
          setIsSquareLoaded(true);
        }
      } catch (err: any) {
        console.error('Square initialization error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to initialize payment form.');
        }
      }
    };

    loadSquareSDK();

    return () => {
      isMounted = false;
      if (cardRef.current) {
        cardRef.current.destroy?.();
      }
    };
  }, [applicationId, locationId, environment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardRef.current || !isSquareLoaded) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const tokenResult = await cardRef.current.tokenize();
      
      if (tokenResult.status === 'OK') {
        const response = await fetch('/api/square-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sourceId: tokenResult.token,
            amount: parseFloat(amount || '0'),
            bookingId,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          toast({
            title: 'Payment Successful',
            description: 'Your booking has been paid successfully.',
          });
          onSuccess();
        } else {
          setError(result.message || 'Payment failed');
          toast({
            title: 'Payment Failed',
            description: result.message || 'Please try again',
            variant: 'destructive',
          });
        }
      } else {
        const errorMessage = tokenResult.errors?.[0]?.message || 'Failed to process card';
        setError(errorMessage);
        toast({
          title: 'Card Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      toast({
        title: 'Payment Error',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted/50 p-3 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground mb-1">Amount to Pay</p>
        <p className="text-2xl font-bold text-brand-accent">${parseFloat(amount || '0').toFixed(2)}</p>
      </div>
      
      <div className="relative">
        {!isSquareLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
            <div className="animate-spin w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full" />
            <span className="ml-3 text-sm text-muted-foreground">Loading payment form...</span>
          </div>
        )}
        <div className="border border-border rounded-lg p-3">
          <div ref={containerRef} id="square-card-container-booking" style={{ minHeight: '89px' }} />
        </div>
      </div>
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
      
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isSquareLoaded || isProcessing}
          className="flex-1 btn-brand-primary"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
}

function ContactSupportForm({ user }: { user: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof insertContactSchema>>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      serviceType: '',
      message: '',
    },
  });

  const submitContactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertContactSchema>) => {
      const response = await apiRequest('POST', '/api/contact', data);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to send message' }));
        throw new Error(error.message || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "We've received your message and will get back to you soon.",
      });
      form.reset({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        serviceType: '',
        message: '',
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertContactSchema>) => {
    submitContactMutation.mutate(data);
  };

  return (
    <Card data-testid="support-section">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-600">
          <HelpCircle className="w-5 h-5" />
          <span>Contact Support</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-muted-foreground">
            Have a question or need assistance? Fill out the form below and our support team will get back to you as soon as possible.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-contact-firstname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-contact-lastname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} data-testid="input-contact-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} data-testid="input-contact-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} placeholder="e.g., Booking inquiry, Payment issue, etc." data-testid="input-contact-subject" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={5}
                      placeholder="Please describe your question or concern..."
                      data-testid="input-contact-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={submitContactMutation.isPending}
                className="min-w-[150px] btn-brand-primary"
                data-testid="button-submit-contact"
              >
                {submitContactMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function PassengerDashboard() {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // Apply dynamic brand colors via CSS variables
  const { colors } = useBrandTheme();
  
  // Navigation state
  const [activeSection, setActiveSection] = useState<'home' | 'booking' | 'saved-locations' | 'future-bookings' | 'past-bookings' | 'invoices' | 'payment-methods' | 'account-details' | 'support'>('home');
  
  // Profile editing state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Update profile state when user data changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

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
  const [showAllBookings, setShowAllBookings] = useState(false);
  
  // Edit address state
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [editAddress, setEditAddress] = useState({ label: '', address: '', lat: '', lon: '' });
  const [editSuggestions, setEditSuggestions] = useState<any[]>([]);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [isSearchingEditAddress, setIsSearchingEditAddress] = useState(false);
  
  // Rating state
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  // Edit/Delete/Cancel state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Booking payment state
  const [bookingPaymentDialogOpen, setBookingPaymentDialogOpen] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [bookingClientSecret, setBookingClientSecret] = useState<string | null>(null);
  const [bookingPaymentProvider, setBookingPaymentProvider] = useState<'stripe' | 'square' | null>(null);
  const [bookingSquareConfig, setBookingSquareConfig] = useState<{
    applicationId: string;
    locationId: string;
    environment: string;
  } | null>(null);
  
  // Cancellation reason options
  const cancellationReasons = [
    'Change of plans',
    'Found alternative transportation',
    'Schedule conflict',
    'Price too high',
    'Booked by mistake',
    'Other',
  ];

  // Helper function to check if booking can be edited (3-hour restriction for non-pending)
  const canEditBooking = (booking: Booking): { canEdit: boolean; reason?: string } => {
    const editableStatuses = ['pending', 'pending_driver_acceptance', 'confirmed', 'in_progress'];
    if (!editableStatuses.includes(booking.status)) {
      return { canEdit: false, reason: 'This booking cannot be edited.' };
    }
    
    // Pending bookings can always be edited
    if (booking.status === 'pending') {
      return { canEdit: true };
    }
    
    // Non-pending bookings need 3+ hours before pickup
    const now = new Date();
    const pickupTime = new Date(booking.scheduledDateTime);
    const hoursBeforePickup = (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursBeforePickup < 3) {
      return { 
        canEdit: false, 
        reason: 'Bookings can only be edited at least 3 hours before pickup.' 
      };
    }
    
    return { canEdit: true };
  };

  // Get hours until pickup for display
  const getHoursUntilPickup = (booking: Booking): number => {
    const now = new Date();
    const pickupTime = new Date(booking.scheduledDateTime);
    return (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  };

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

  // Fetch payment methods for card status check
  const { data: paymentData } = useQuery<PaymentMethodsResponse>({
    queryKey: ['/api/payment-methods'],
    retry: false,
    enabled: isAuthenticated && user?.role === 'passenger',
  });

  const paymentMethods = paymentData?.paymentMethods || [];

  // Fetch site logo from CMS
  const { data: siteLogoData } = useQuery<{ logo?: { url: string; alt?: string } }>({
    queryKey: ['/api/site-logo'],
    retry: false,
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

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; phone: string; email: string }) => {
      const response = await apiRequest('PATCH', '/api/user/profile', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.setQueryData(['/api/auth/user'], updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest('PATCH', '/api/user/password', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update password');
      }
      return await response.json();
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  // Submit driver rating mutation
  const submitRatingMutation = useMutation({
    mutationFn: async (ratingData: { bookingId: string; rating: number; comment?: string }) => {
      const response = await apiRequest('POST', '/api/ratings', ratingData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit rating');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setRatingDialogOpen(false);
      setSelectedBookingForRating(null);
      setRating(0);
      setRatingComment('');
      toast({
        title: "Rating Submitted",
        description: "Thank you for rating your driver!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    },
  });

  // Edit booking mutation
  const editBookingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/bookings/${id}`, updates);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update booking');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setEditDialogOpen(false);
      setSelectedBooking(null);
      toast({
        title: "Booking Updated",
        description: "Your booking has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking",
        variant: "destructive",
      });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/bookings/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete booking');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setDeleteDialogOpen(false);
      setSelectedBooking(null);
      toast({
        title: "Booking Deleted",
        description: "Your booking has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking",
        variant: "destructive",
      });
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiRequest('PATCH', `/api/bookings/${id}/cancel`, { reason });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel booking');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setCancelDialogOpen(false);
      setSelectedBooking(null);
      setCancelReason('');
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  // Create booking payment intent mutation
  const createBookingPaymentMutation = useMutation({
    mutationFn: async ({ bookingId, amount }: { bookingId: string; amount: number }) => {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId, amount }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setBookingPaymentProvider(data.provider);
      if (data.provider === 'stripe') {
        setBookingClientSecret(data.clientSecret);
        setBookingSquareConfig(null);
      } else if (data.provider === 'square') {
        setBookingClientSecret(null);
        setBookingSquareConfig({
          applicationId: data.applicationId,
          locationId: data.locationId,
          environment: data.environment,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
      setBookingPaymentDialogOpen(false);
      setPaymentBooking(null);
      setBookingPaymentProvider(null);
      setBookingSquareConfig(null);
    },
  });

  // Handle booking payment
  const handlePayBooking = (booking: Booking) => {
    setPaymentBooking(booking);
    setBookingPaymentDialogOpen(true);
    createBookingPaymentMutation.mutate({ 
      bookingId: booking.id, 
      amount: parseFloat(booking.totalAmount) 
    });
  };

  // Check if booking can be paid
  const canPayBooking = (booking: Booking): boolean => {
    // Can pay if: not paid AND not cancelled AND amount > 0
    return booking.paymentStatus !== 'paid' && 
           booking.status !== 'cancelled' && 
           parseFloat(booking.totalAmount) > 0;
  };

  // POI category helper function
  const getPOICategoryInfo = (poi: any): { icon: string; label: string } => {
    if (!poi) return { icon: 'building', label: 'Place' };
    let categoryName = '';
    if (poi.categories && poi.categories.length > 0) {
      categoryName = poi.categories.join(' ').toLowerCase();
    } else if (poi.classifications && poi.classifications.length > 0) {
      const classification = poi.classifications[0];
      if (classification.names && classification.names.length > 0) {
        categoryName = classification.names.map((n: any) => n.name || n).join(' ').toLowerCase();
      } else if (classification.code) {
        categoryName = classification.code.toLowerCase();
      }
    } else if (poi.categorySet && poi.categorySet.length > 0) {
      categoryName = poi.categorySet[0]?.name?.toLowerCase() || '';
    }
    
    if (categoryName.includes('airport') || categoryName.includes('aviation')) return { icon: 'plane', label: 'Airport' };
    if (categoryName.includes('hotel') || categoryName.includes('motel') || categoryName.includes('lodging')) return { icon: 'hotel', label: 'Hotel' };
    if (categoryName.includes('restaurant') || categoryName.includes('food') || categoryName.includes('dining')) return { icon: 'restaurant', label: 'Restaurant' };
    if (categoryName.includes('cafe') || categoryName.includes('coffee')) return { icon: 'coffee', label: 'Cafe' };
    if (categoryName.includes('hospital') || categoryName.includes('medical') || categoryName.includes('health')) return { icon: 'hospital', label: 'Medical' };
    if (categoryName.includes('school') || categoryName.includes('university') || categoryName.includes('college')) return { icon: 'school', label: 'Education' };
    if (categoryName.includes('shop') || categoryName.includes('store') || categoryName.includes('mall')) return { icon: 'shopping', label: 'Shopping' };
    if (categoryName.includes('parking') || categoryName.includes('car') || categoryName.includes('automotive')) return { icon: 'car', label: 'Automotive' };
    if (categoryName.includes('government') || categoryName.includes('civic')) return { icon: 'landmark', label: 'Government' };
    
    return { icon: 'building', label: 'Place' };
  };

  // Render POI category icon
  const renderPOIIcon = (iconType: string) => {
    const iconProps = { className: "w-4 h-4 text-primary mt-0.5 flex-shrink-0" };
    switch (iconType) {
      case 'plane': return <Plane {...iconProps} />;
      case 'hotel': return <Hotel {...iconProps} />;
      case 'restaurant': return <Utensils {...iconProps} />;
      case 'coffee': return <Coffee {...iconProps} />;
      case 'hospital': return <Hospital {...iconProps} />;
      case 'school': return <School {...iconProps} />;
      case 'shopping': return <ShoppingBag {...iconProps} />;
      case 'car': return <Car {...iconProps} />;
      case 'landmark': return <Landmark {...iconProps} />;
      default: return <Building2 {...iconProps} />;
    }
  };

  // TomTom address search with debouncing
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingAddress(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const suggestionWithPOI = data.results.map((result: any) => ({
            ...result,
            isPOI: !!result.poi,
            poiCategory: result.poi ? getPOICategoryInfo(result.poi).label : '',
            poiCategoryIcon: result.poi ? getPOICategoryInfo(result.poi).icon : 'mappin',
            displayName: result.poi?.name || result.address?.freeformAddress || '',
            secondaryText: result.poi ? result.address?.freeformAddress : '',
          }));
          setAddressSuggestions(suggestionWithPOI);
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
    const address = suggestion.address?.freeformAddress || suggestion.displayName || '';
    const lat = suggestion.position.lat.toString();
    const lon = suggestion.position.lon.toString();
    
    setNewAddress(prev => ({ ...prev, address, lat, lon }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // TomTom address search for edit with debouncing
  const searchEditAddress = async (query: string) => {
    if (query.length < 3) {
      setEditSuggestions([]);
      setShowEditSuggestions(false);
      return;
    }

    setIsSearchingEditAddress(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const suggestionWithPOI = data.results.map((result: any) => ({
            ...result,
            isPOI: !!result.poi,
            poiCategory: result.poi ? getPOICategoryInfo(result.poi).label : '',
            poiCategoryIcon: result.poi ? getPOICategoryInfo(result.poi).icon : 'mappin',
            displayName: result.poi?.name || result.address?.freeformAddress || '',
            secondaryText: result.poi ? result.address?.freeformAddress : '',
          }));
          setEditSuggestions(suggestionWithPOI);
          setShowEditSuggestions(true);
        } else {
          setEditSuggestions([]);
          setShowEditSuggestions(false);
        }
      }
    } catch (error) {
      console.error('Edit address search error:', error);
    } finally {
      setIsSearchingEditAddress(false);
    }
  };

  // Debounced edit address search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editAddress.address && editAddressOpen) {
        searchEditAddress(editAddress.address);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [editAddress.address, editAddressOpen]);

  const handleEditAddressSelect = (suggestion: any) => {
    const address = suggestion.address?.freeformAddress || suggestion.displayName || '';
    const lat = suggestion.position.lat.toString();
    const lon = suggestion.position.lon.toString();
    
    setEditAddress(prev => ({ ...prev, address, lat, lon }));
    setShowEditSuggestions(false);
    setEditSuggestions([]);
  };

  const handleEditClick = (location: any) => {
    setEditingAddress(location);
    setEditAddress({
      label: location.label,
      address: location.address,
      lat: location.lat || '',
      lon: location.lon || ''
    });
    setEditAddressOpen(true);
  };

  // Edit address mutation
  const editAddressMutation = useMutation({
    mutationFn: async (data: { id: string; label: string; address: string; lat?: string; lon?: string }) => {
      const response = await apiRequest('PATCH', `/api/saved-addresses/${data.id}`, {
        label: data.label,
        address: data.address,
        lat: data.lat,
        lon: data.lon
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update address');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-addresses'] });
      setEditAddressOpen(false);
      setEditingAddress(null);
      setEditAddress({ label: '', address: '', lat: '', lon: '' });
      toast({
        title: "Location Updated",
        description: "Your saved location has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update location",
        variant: "destructive",
      });
    },
  });

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

  const getPaymentCardStatus = () => {
    if (!paymentMethods || paymentMethods.length === 0) {
      return {
        status: 'No Card',
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        message: 'No payment method on file. Please add a card to enable seamless bookings.',
        action: 'Add Payment Method',
      };
    }

    // Check for expired cards
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based

    const hasExpiredCards = paymentMethods.some(pm => {
      const expYear = pm.card.exp_year;
      const expMonth = pm.card.exp_month;
      return expYear < currentYear || (expYear === currentYear && expMonth < currentMonth);
    });

    const hasValidCards = paymentMethods.some(pm => {
      const expYear = pm.card.exp_year;
      const expMonth = pm.card.exp_month;
      return expYear > currentYear || (expYear === currentYear && expMonth >= currentMonth);
    });

    if (hasExpiredCards && !hasValidCards) {
      return {
        status: 'Expired',
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        message: 'All payment cards have expired. Please update your payment information.',
        action: 'Update Payment Method',
      };
    }

    if (hasExpiredCards && hasValidCards) {
      return {
        status: 'Active (with expired cards)',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        message: 'You have expired cards. Please remove them and keep your payment methods up to date.',
        action: 'Manage Payment Methods',
      };
    }

    return {
      status: 'Active',
      color: 'text-green-600',
      bgColor: '',
      borderColor: '',
      message: '',
      action: '',
    };
  };

  const paymentCardStatus = getPaymentCardStatus();

  const handleEditBooking = (booking: Booking) => {
    const editCheck = canEditBooking(booking);
    if (!editCheck.canEdit) {
      toast({
        title: "Cannot Edit Booking",
        description: editCheck.reason,
        variant: "destructive",
      });
      return;
    }
    setSelectedBooking(booking);
    setEditDialogOpen(true);
  };

  const handleDeleteBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setDeleteDialogOpen(true);
  };

  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "All password fields are required",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
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

  // Split bookings into future and past
  const now = new Date();
  
  // Recent bookings: exclude cancelled and past bookings, show only active upcoming ones
  const recentBookings = bookings?.filter(b => 
    b.status !== 'cancelled' && 
    b.status !== 'completed' &&
    new Date(b.scheduledDateTime) >= now
  ).slice(0, 5) || [];
  
  // Future bookings: all non-cancelled and non-completed bookings scheduled for the future
  const futureBookings = bookings?.filter(b => 
    b.status !== 'cancelled' && 
    b.status !== 'completed' &&
    new Date(b.scheduledDateTime) >= now
  ) || [];
  
  // Past bookings: cancelled, completed, or past-dated bookings that aren't actively happening
  const pastBookings = bookings?.filter(b => 
    b.status === 'completed' || 
    b.status === 'cancelled' ||
    (new Date(b.scheduledDateTime) < now && 
     b.status !== 'in_progress' && 
     b.status !== 'on_the_way' && 
     b.status !== 'arrived' && 
     b.status !== 'on_board' &&
     b.status !== 'pending' &&
     b.status !== 'confirmed' &&
     b.status !== 'pending_driver_acceptance')
  ) || [];

  return (
    <div className="min-h-screen bg-card relative overflow-hidden">
      {/* Subtle Light Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-light via-white to-gray-50" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(220 38 38 / 0.03) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      {/* Modern Header */}
      <header className="relative z-10 border-b border-border backdrop-blur-xl bg-card shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              {/* Clean Logo Display */}
              {siteLogoData?.logo?.url ? (
                <img 
                  src={siteLogoData.logo.url} 
                  alt={siteLogoData.logo.alt || "Luxury Transportation"} 
                  className="h-16 w-auto object-contain"
                  data-testid="dashboard-logo"
                />
              ) : (
                <div className="w-16 h-16 bg-card border border-border rounded-lg flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" data-testid="" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-black" data-testid="passenger-title">
                  Passenger Dashboard
                </h1>
                <p className="text-muted-foreground text-lg mt-1" data-testid="passenger-subtitle">
                  Welcome back, <span className="font-medium" style={{ color: 'var(--brand-accent-hex)' }}>{user?.firstName || user?.email}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="px-4 py-2 rounded-xl font-medium transition-all duration-300 border-border hover:bg-muted"
                data-testid="button-main-site"
              >
                <Home className="w-4 h-4 mr-2" />
                Main Site
              </Button>
              <Button 
                onClick={() => window.location.href = '/api/logout'}
                className="bg-black hover:bg-gray-900 text-white border border-gray-800 px-6 py-3 rounded-xl font-medium transition-all duration-300"
                style={{ borderColor: 'var(--brand-accent-hex)' }}
                data-testid="button-logout"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Navigation Menu - Mobile Optimized */}
      <div className="relative z-10 border-b border-border backdrop-blur-xl bg-card">
        <div className="max-w-7xl mx-auto px-2 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-px" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <button
              onClick={() => setActiveSection('home')}
              className={`relative py-3 px-3 sm:px-6 font-medium text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap min-w-[70px] sm:min-w-auto ${
                activeSection === 'home'
                  ? 'nav-tab-active'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid="nav-home"
            >
              {activeSection === 'home' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 nav-tab-indicator" />
              )}
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Home</span>
              <span className="sm:hidden text-[10px]">Home</span>
            </button>
            <button
              onClick={() => setActiveSection('saved-locations')}
              className={`relative py-3 px-3 sm:px-6 font-medium text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap min-w-[70px] sm:min-w-auto ${
                activeSection === 'saved-locations'
                  ? 'nav-tab-active'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid="nav-saved-locations"
            >
              {activeSection === 'saved-locations' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 nav-tab-indicator" />
              )}
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Saved Locations</span>
              <span className="sm:hidden text-[10px]">Saved</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`relative py-3 px-3 sm:px-6 font-medium text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap min-w-[70px] sm:min-w-auto ${
                    activeSection === 'future-bookings' || activeSection === 'past-bookings'
                      ? 'nav-tab-active'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  data-testid="nav-bookings"
                >
                  {(activeSection === 'future-bookings' || activeSection === 'past-bookings') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 nav-tab-indicator" />
                  )}
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Bookings</span>
                  <span className="sm:hidden text-[10px]">Bookings</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="bg-card border-border text-black min-w-[180px]"
                data-testid="bookings-dropdown"
              >
                <DropdownMenuItem
                  onClick={() => setActiveSection('future-bookings')}
                  className="cursor-pointer hover:bg-brand-light focus:bg-brand-light text-black"
                  data-testid="nav-future-bookings"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Future Bookings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setActiveSection('past-bookings')}
                  className="cursor-pointer hover:bg-brand-light focus:bg-brand-light text-black"
                  data-testid="nav-past-bookings"
                >
                  <History className="w-4 h-4 mr-2" />
                  <span>Past Bookings</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => setActiveSection('invoices')}
              className={`relative py-3 px-3 sm:px-6 font-medium text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap min-w-[70px] sm:min-w-auto ${
                activeSection === 'invoices'
                  ? 'nav-tab-active'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid="nav-invoices"
            >
              {activeSection === 'invoices' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 nav-tab-indicator" />
              )}
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Invoices</span>
              <span className="sm:hidden text-[10px]">Invoices</span>
            </button>
            <button
              onClick={() => setActiveSection('payment-methods')}
              className={`relative py-3 px-3 sm:px-6 font-medium text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap min-w-[70px] sm:min-w-auto ${
                activeSection === 'payment-methods'
                  ? 'nav-tab-active'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid="nav-payment-methods"
            >
              {activeSection === 'payment-methods' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 nav-tab-indicator" />
              )}
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Payment Methods</span>
              <span className="sm:hidden text-[10px]">Payment</span>
            </button>
            <button
              onClick={() => setActiveSection('account-details')}
              className={`relative py-3 px-3 sm:px-6 font-medium text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap min-w-[70px] sm:min-w-auto ${
                activeSection === 'account-details'
                  ? 'nav-tab-active'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid="nav-account-details"
            >
              {activeSection === 'account-details' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 nav-tab-indicator" />
              )}
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Account Details</span>
              <span className="sm:hidden text-[10px]">Account</span>
            </button>
            <button
              onClick={() => setActiveSection('support')}
              className={`relative py-3 px-3 sm:px-6 font-medium text-xs sm:text-sm flex flex-col sm:flex-row items-center gap-1 sm:gap-2 transition-all duration-300 rounded-t-xl whitespace-nowrap min-w-[70px] sm:min-w-auto ${
                activeSection === 'support'
                  ? 'nav-tab-active'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid="nav-support"
            >
              {activeSection === 'support' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 nav-tab-indicator" />
              )}
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Support</span>
              <span className="sm:hidden text-[10px]">Support</span>
            </button>
          </nav>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-8 space-y-8">
        {/* Home Section */}
        {activeSection === 'home' && (
          <>
            {/* Quick Actions - Compact Professional Design */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm" data-testid="quick-actions">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground mr-1">Quick Actions:</span>
                <Button
                  onClick={() => setActiveSection('booking')}
                  size="sm"
                  className="btn-brand-primary h-9 px-4 gap-2 font-medium shadow-sm hover:shadow-md transition-shadow"
                  data-testid="button-book-ride"
                >
                  <MapPin className="w-4 h-4" />
                  Book a Ride
                </Button>
                <Button
                  onClick={() => setActiveSection('past-bookings')}
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 gap-2 font-medium border-border hover:bg-muted hover:border-[var(--brand-primary-hex)] transition-all"
                  data-testid="button-view-history"
                >
                  <History className="w-4 h-4" />
                  History
                </Button>
                <Button
                  onClick={() => setActiveSection('saved-locations')}
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 gap-2 font-medium border-border hover:bg-muted hover:border-[var(--brand-primary-hex)] transition-all"
                  data-testid="button-saved-locations"
                >
                  <MapPin className="w-4 h-4" />
                  Saved Places
                </Button>
                <Button
                  onClick={() => setActiveSection('support')}
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 gap-2 font-medium border-border hover:bg-muted hover:border-[var(--brand-primary-hex)] transition-all"
                  data-testid="button-support"
                >
                  <HelpCircle className="w-4 h-4" />
                  Support
                </Button>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="relative group" data-testid="recent-bookings">
              <div className="absolute -inset-0.5 glow-brand rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
              <Card className="relative bg-card border-border shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-black flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl icon-brand-bg flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              Recent Bookings
            </CardTitle>
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
                    className="bg-gradient-to-r from-muted to-background dark:from-muted dark:to-background rounded-xl p-5 border border-border hover:border-brand hover:shadow-md transition-all"
                    data-testid={`booking-${booking.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold text-foreground" data-testid={`booking-route-${booking.id}`}>
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
                      <div className="text-right space-y-1 flex flex-col items-end ml-4">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#29b24a]" data-testid={`booking-total-${booking.id}`}>
                            ${booking.totalAmount}
                          </p>
                          {booking.paymentStatus === 'paid' ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200" data-testid={`booking-payment-status-${booking.id}`}>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200" data-testid={`booking-payment-status-${booking.id}`}>
                              Unpaid
                            </Badge>
                          )}
                        </div>
                        <Badge variant={getStatusColor(booking.status)} data-testid={`booking-status-${booking.id}`}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                    {booking.driverId && (booking.driverFirstName || booking.driverLastName) && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-start space-x-3">
                          <Avatar className="w-10 h-10 border-2 border-primary/20">
                            {booking.driverProfileImageUrl ? (
                              <AvatarImage 
                                src={booking.driverProfileImageUrl} 
                                alt={`${booking.driverFirstName || ''} ${booking.driverLastName || ''}`}
                              />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                              {(booking.driverFirstName?.[0] || '').toUpperCase()}
                              {(booking.driverLastName?.[0] || '').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium" data-testid={`booking-driver-name-${booking.id}`}>
                              Driver: {booking.driverFirstName} {booking.driverLastName}
                            </p>
                            {booking.driverPhone && (
                              <p className="text-xs text-muted-foreground" data-testid={`booking-driver-phone-${booking.id}`}>
                                📞 {booking.driverPhone}
                              </p>
                            )}
                            {booking.driverVehiclePlate && (
                              <p className="text-xs text-muted-foreground" data-testid={`booking-driver-plate-${booking.id}`}>
                                🚗 Plate: {booking.driverVehiclePlate}
                              </p>
                            )}
                            {booking.driverCredentials && (
                              <p className="text-xs text-muted-foreground" data-testid={`booking-driver-credentials-${booking.id}`}>
                                {booking.driverCredentials}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {booking.status === 'pending' && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 rounded-md px-2 py-1.5">
                          <Info className="w-3 h-3 flex-shrink-0 text-blue-500" />
                          <span>Editing allowed up to 3 hours before booking time</span>
                        </div>
                        <div className="flex gap-2">
                          {canPayBooking(booking) && (
                            <Button
                              size="sm"
                              className="btn-brand-primary"
                              onClick={() => handlePayBooking(booking)}
                              data-testid={`button-pay-${booking.id}`}
                            >
                              <DollarSign className="w-3 h-3 mr-1" />
                              Pay Now
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditBooking(booking)}
                            data-testid={`button-edit-${booking.id}`}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBooking(booking)}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            data-testid={`button-delete-${booking.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                    {(booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'pending_driver_acceptance') && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        {/* 3-hour restriction notice */}
                        {(() => {
                          const editCheck = canEditBooking(booking);
                          const hoursLeft = getHoursUntilPickup(booking);
                          return (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              {editCheck.canEdit ? (
                                <span>You can edit this booking (pickup in {Math.floor(hoursLeft)}h {Math.round((hoursLeft % 1) * 60)}m)</span>
                              ) : (
                                <span className="text-amber-600">Editing disabled - must be 3+ hours before pickup</span>
                              )}
                            </div>
                          );
                        })()}
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditBooking(booking)}
                                  disabled={!canEditBooking(booking).canEdit}
                                  data-testid={`button-edit-${booking.id}`}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </TooltipTrigger>
                            {!canEditBooking(booking).canEdit && (
                              <TooltipContent>
                                <p>{canEditBooking(booking).reason}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelBooking(booking)}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            data-testid={`button-cancel-${booking.id}`}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Cancel Booking
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12" data-testid="no-bookings">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg font-medium">No bookings yet</p>
                <p className="text-muted-foreground text-sm mt-2">Start your first ride with us!</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
          </>
        )}

        {/* Booking Section */}
        {activeSection === 'booking' && (
          <div className="relative group">
            <div className="absolute -inset-0.5 glow-brand rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
            <Card className="relative bg-card border-border shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="card-header-brand">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-card/20 backdrop-blur-sm flex items-center justify-center shadow-md">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  Book Your Luxury Transportation
                </CardTitle>
                <p className="text-white/80 mt-2 text-sm">Premium rides at your fingertips</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-white via-white to-gray-50">
                  <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                    <BookingForm />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Saved Locations Section */}
        {activeSection === 'saved-locations' && (
          <div className="relative group">
            <div className="absolute -inset-0.5 glow-brand rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
            <Card className="relative bg-card border-border shadow-lg hover:shadow-xl transition-shadow" data-testid="saved-addresses">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl icon-brand-bg flex items-center justify-center shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                Saved Locations
              </CardTitle>
              <Dialog open={addAddressOpen} onOpenChange={setAddAddressOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="btn-brand-primary" data-testid="button-add-address">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-md bg-[#ffffff]" data-testid="add-address-dialog">
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
                        <div className="absolute z-50 w-full mt-1 bg-card dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {addressSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-border dark:border-gray-700 last:border-0 transition-colors"
                              onClick={() => handleAddressSelect(suggestion)}
                              data-testid={`suggestion-${index}`}
                            >
                              <div className="flex items-start space-x-2">
                                {suggestion.isPOI ? (
                                  renderPOIIcon(suggestion.poiCategoryIcon || 'building')
                                ) : (
                                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground dark:text-gray-100 truncate">
                                      {suggestion.displayName || suggestion.address?.freeformAddress}
                                    </span>
                                    {suggestion.isPOI && suggestion.poiCategory && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex-shrink-0">
                                        {suggestion.poiCategory}
                                      </span>
                                    )}
                                  </div>
                                  {suggestion.secondaryText ? (
                                    <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">
                                      {suggestion.secondaryText}
                                    </p>
                                  ) : suggestion.address?.country && (
                                    <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">
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
          <CardContent className="pt-2">
            {addressesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full" />
              </div>
            ) : addresses && addresses.length > 0 ? (
              <div className="divide-y divide-border">
                {addresses.map((address) => {
                  const IconComponent = getAddressIcon(address.label);
                  return (
                    <div
                      key={address.id}
                      className="group flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`address-${address.id}`}
                    >
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4 text-red-600" />
                      </div>
                      
                      {/* Label & Address */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            data-testid={`address-label-${address.id}`}
                          >
                            {address.label}
                          </span>
                        </div>
                        <p 
                          className="text-sm text-muted-foreground truncate mt-0.5"
                          data-testid={`address-text-${address.id}`}
                          title={address.address}
                        >
                          {address.address}
                        </p>
                      </div>
                      
                      {/* Action Buttons - Always visible for touch accessibility */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/?from=${encodeURIComponent(address.address)}`}
                              className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600"
                              data-testid={`button-from-${address.id}`}
                              aria-label="Book from this location"
                            >
                              From
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Start pickup here
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/?to=${encodeURIComponent(address.address)}`}
                              className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600"
                              data-testid={`button-to-${address.id}`}
                              aria-label="Book to this location"
                            >
                              To
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Set destination here
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(address);
                              }}
                              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              data-testid={`button-edit-address-${address.id}`}
                              aria-label="Edit this location"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Edit
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAddressMutation.mutate(address.id);
                              }}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              data-testid={`button-delete-address-${address.id}`}
                              aria-label="Delete this location"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Delete
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10" data-testid="no-addresses">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No saved locations</p>
                <p className="text-sm text-muted-foreground mt-1">Add locations for quick booking</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Edit Address Dialog */}
        <Dialog open={editAddressOpen} onOpenChange={setEditAddressOpen}>
          <DialogContent className="bg-card dark:bg-gray-900 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Location</DialogTitle>
              <DialogDescription>Update your saved location</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-label" className="text-foreground">Label</Label>
                <Input
                  id="edit-label"
                  placeholder="Home, Work, Gym, etc."
                  value={editAddress.label}
                  onChange={(e) => setEditAddress(prev => ({ ...prev, label: e.target.value }))}
                  data-testid="input-edit-label"
                  className="border-border focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div className="relative">
                <Label htmlFor="edit-address" className="text-foreground">Address</Label>
                <Input
                  id="edit-address"
                  placeholder="123 Main Street, City, State"
                  value={editAddress.address}
                  onChange={(e) => setEditAddress(prev => ({ ...prev, address: e.target.value }))}
                  onFocus={() => {
                    if (editSuggestions.length > 0) {
                      setShowEditSuggestions(true);
                    }
                  }}
                  data-testid="input-edit-address"
                  autoComplete="off"
                  className="border-border focus:border-red-500 focus:ring-red-500"
                />
                {isSearchingEditAddress && (
                  <div className="absolute right-3 top-9 pointer-events-none">
                    <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
                  </div>
                )}
                {showEditSuggestions && editSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-card dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {editSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-border dark:border-gray-700 last:border-0 transition-colors"
                        onClick={() => handleEditAddressSelect(suggestion)}
                        data-testid={`edit-suggestion-${index}`}
                      >
                        <div className="flex items-start space-x-2">
                          {suggestion.isPOI ? (
                            renderPOIIcon(suggestion.poiCategoryIcon || 'building')
                          ) : (
                            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground dark:text-gray-100 truncate">
                                {suggestion.displayName || suggestion.address?.freeformAddress}
                              </span>
                              {suggestion.isPOI && suggestion.poiCategory && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex-shrink-0">
                                  {suggestion.poiCategory}
                                </span>
                              )}
                            </div>
                            {suggestion.secondaryText ? (
                              <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">
                                {suggestion.secondaryText}
                              </p>
                            ) : suggestion.address?.country && (
                              <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">
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
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-update-address"
              >
                {editAddressMutation.isPending ? 'Updating...' : 'Update Location'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        )}

        {/* Future Bookings Section */}
        {activeSection === 'future-bookings' && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl opacity-10 group-hover:opacity-20 blur transition-opacity duration-500" />
            <Card className="relative bg-card border-border shadow-lg hover:shadow-xl transition-shadow" data-testid="future-bookings-section">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                Future Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full" />
                </div>
              ) : futureBookings.length > 0 ? (
                <div className="space-y-4">
                  {futureBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gradient-to-r from-muted to-background dark:from-muted dark:to-background rounded-xl p-5 border border-border hover:border-orange-300 hover:shadow-md transition-all"
                      data-testid={`future-booking-${booking.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <p className="font-medium" data-testid={`future-booking-route-${booking.id}`}>
                            {booking.pickupAddress} → {booking.destinationAddress || 'Hourly Service'}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span data-testid={`future-booking-date-${booking.id}`}>
                              {new Date(booking.scheduledDateTime).toLocaleDateString()} • {new Date(booking.scheduledDateTime).toLocaleTimeString()}
                            </span>
                            <Badge variant="outline" data-testid={`future-booking-type-${booking.id}`}>
                              {booking.bookingType}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right space-y-1 flex flex-col items-end ml-4">
                          <p className="font-bold text-[#29b24a]" data-testid={`future-booking-total-${booking.id}`}>
                            ${booking.totalAmount}
                          </p>
                          <Badge variant={getStatusColor(booking.status)} data-testid={`future-booking-status-${booking.id}`}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                      {booking.status === 'pending' && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 rounded-md px-2 py-1.5">
                            <Info className="w-3 h-3 flex-shrink-0 text-blue-500" />
                            <span>Editing allowed up to 3 hours before booking time</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditBooking(booking)}
                              data-testid={`button-edit-future-${booking.id}`}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteBooking(booking)}
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              data-testid={`button-delete-future-${booking.id}`}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                      {(booking.status === 'confirmed' || booking.status === 'in_progress' || booking.status === 'pending_driver_acceptance') && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          {/* 3-hour restriction notice */}
                          {(() => {
                            const editCheck = canEditBooking(booking);
                            const hoursLeft = getHoursUntilPickup(booking);
                            return (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                {editCheck.canEdit ? (
                                  <span>You can edit this booking (pickup in {Math.floor(hoursLeft)}h {Math.round((hoursLeft % 1) * 60)}m)</span>
                                ) : (
                                  <span className="text-amber-600">Editing disabled - must be 3+ hours before pickup</span>
                                )}
                              </div>
                            );
                          })()}
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditBooking(booking)}
                                    disabled={!canEditBooking(booking).canEdit}
                                    data-testid={`button-edit-future-${booking.id}`}
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              {!canEditBooking(booking).canEdit && (
                                <TooltipContent>
                                  <p>{canEditBooking(booking).reason}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelBooking(booking)}
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              data-testid={`button-cancel-future-${booking.id}`}
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Cancel Booking
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12" data-testid="no-future-bookings">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-lg font-medium">No upcoming bookings</p>
                  <p className="text-muted-foreground text-sm mt-2">Book your next ride with us!</p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Past Bookings Section - Compact Professional Design */}
        {activeSection === 'past-bookings' && (
          <Card className="bg-card border-border shadow-sm" data-testid="past-bookings-section">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg icon-brand-bg flex items-center justify-center">
                  <History className="w-4 h-4 text-white" />
                </div>
                Past Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {bookingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-5 h-5 border-2 border-[var(--brand-primary-hex)] border-t-transparent rounded-full" />
                </div>
              ) : pastBookings.length > 0 ? (
                <div className="divide-y divide-border">
                  {pastBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="py-4 first:pt-0 last:pb-0"
                      data-testid={`past-booking-${booking.id}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate" data-testid={`past-booking-route-${booking.id}`}>
                            {booking.pickupAddress} → {booking.destinationAddress || 'Hourly Service'}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span data-testid={`past-booking-date-${booking.id}`}>
                              {new Date(booking.scheduledDateTime).toLocaleDateString()} • {new Date(booking.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <Badge variant="outline" className="text-xs h-5" data-testid={`past-booking-type-${booking.id}`}>
                              {booking.bookingType}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="font-semibold text-sm text-green-600" data-testid={`past-booking-total-${booking.id}`}>
                            ${booking.totalAmount}
                          </p>
                          <Badge 
                            variant={getStatusColor(booking.status)} 
                            className="text-xs h-5"
                            data-testid={`past-booking-status-${booking.id}`}
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                      {booking.status === 'cancelled' && (booking as any).cancelReason && (
                        <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-xs text-red-700">
                            <span className="font-medium">Cancellation reason:</span> {(booking as any).cancelReason}
                          </p>
                        </div>
                      )}
                      {booking.driverId && (booking.driverFirstName || booking.driverLastName) && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span data-testid={`past-booking-driver-name-${booking.id}`}>
                            {booking.driverFirstName} {booking.driverLastName}
                          </span>
                          {booking.driverPhone && (
                            <span className="text-muted-foreground" data-testid={`past-booking-driver-phone-${booking.id}`}>
                              • {booking.driverPhone}
                            </span>
                          )}
                        </div>
                      )}
                      {booking.status === 'completed' && booking.driverId && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedBookingForRating(booking);
                              setRatingDialogOpen(true);
                            }}
                            data-testid={`button-rate-driver-past-${booking.id}`}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Rate Driver
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10" data-testid="no-past-bookings">
                  <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                    <History className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No past bookings</p>
                  <p className="text-sm text-muted-foreground mt-1">Completed rides will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invoices Section - Compact Professional Design */}
        {activeSection === 'invoices' && (
          <Card className="bg-card border-border shadow-sm" data-testid="invoices-section">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg icon-brand-bg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                My Invoices
              </CardTitle>
              <p className="text-xs text-muted-foreground">View and manage your ride invoices</p>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs defaultValue="current" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="current" data-testid="tab-current-invoices">Current Invoices</TabsTrigger>
                  <TabsTrigger value="old" data-testid="tab-old-invoices">Old Invoices</TabsTrigger>
                </TabsList>
                <TabsContent value="current">
                  <InvoicesList />
                </TabsContent>
                <TabsContent value="old">
                  <OldInvoicesList />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods Section - Compact Professional Design */}
        {activeSection === 'payment-methods' && (
          <Card className="bg-card border-border shadow-sm" data-testid="payment-methods-section">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg icon-brand-bg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <PaymentMethodsList />
            </CardContent>
          </Card>
        )}

        {/* Account Details Section - Ultra Compact */}
        {activeSection === 'account-details' && (
          <Card className="bg-card border-border shadow-sm" data-testid="account-details-card">
            <CardContent className="p-4 space-y-4">
              {/* Status Row */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">Type: <span className="font-medium text-foreground capitalize" data-testid="text-role">{user?.role || 'N/A'}</span></span>
                  <span className="text-xs" data-testid="text-status">
                    {user?.isActive ? (
                      <span className="text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-600 rounded-full" />Active</span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-600 rounded-full" />Inactive</span>
                    )}
                  </span>
                  <span className={`text-xs ${paymentCardStatus.color}`} data-testid="text-payment-status">{paymentCardStatus.status}</span>
                  {user?.payLaterEnabled && <span className="text-xs text-brand-accent">✓ Pay Later</span>}
                  {(user as any)?.discountType && ((user as any)?.discountValue ?? 0) > 0 && (
                    <span className="text-xs text-brand-accent">
                      {(user as any).discountType === 'percentage' ? `${(user as any).discountValue}% off` : `$${(user as any).discountValue} off`}
                    </span>
                  )}
                </div>
                {paymentCardStatus.message && (
                  <Button size="sm" onClick={() => setActiveSection('payment-methods')} className="h-6 px-2 text-xs bg-amber-600 hover:bg-amber-500 text-white" data-testid="button-manage-payment">
                    {paymentCardStatus.action}
                  </Button>
                )}
              </div>

              {/* Profile Form */}
              <form onSubmit={handleProfileSubmit} className="space-y-2" data-testid="profile-card">
                <p className="text-xs font-medium text-muted-foreground">Profile</p>
                <div className="grid grid-cols-4 gap-2">
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name *" className="h-8 text-xs" data-testid="input-first-name" />
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name *" className="h-8 text-xs" data-testid="input-last-name" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" className="h-8 text-xs" data-testid="input-email" />
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="h-8 text-xs" data-testid="input-phone" />
                </div>
                <Button type="submit" disabled={updateProfileMutation.isPending} size="sm" className="h-7 px-3 text-xs btn-brand-primary border-0" data-testid="button-save">
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>

              {/* Password Form */}
              <form onSubmit={handlePasswordSubmit} className="space-y-2 pt-2 border-t border-border" data-testid="password-card">
                <p className="text-xs font-medium text-muted-foreground">Password</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current *" className="h-8 text-xs" data-testid="input-current-password" />
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New *" className="h-8 text-xs" data-testid="input-new-password" />
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm *" className="h-8 text-xs" data-testid="input-confirm-password" />
                </div>
                <Button type="submit" disabled={updatePasswordMutation.isPending} size="sm" className="h-7 px-3 text-xs btn-brand-primary border-0" data-testid="button-update-password">
                  {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Support Section */}
        {activeSection === 'support' && <ContactSupportForm user={user} />}
      </div>

      {/* Full Booking History Dialog */}
      <Dialog open={showAllBookings} onOpenChange={setShowAllBookings}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-[#ffffff]">
          <DialogHeader>
            <DialogTitle>Complete Ride History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-muted rounded-lg p-4"
                    data-testid={`history-booking-${booking.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium" data-testid={`history-booking-route-${booking.id}`}>
                          {booking.pickupAddress} → {booking.destinationAddress || 'Hourly Service'}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap gap-2">
                          <span data-testid={`history-booking-date-${booking.id}`}>
                            📅 {new Date(booking.scheduledDateTime).toLocaleDateString()}
                          </span>
                          <span>
                            🕐 {new Date(booking.scheduledDateTime).toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" data-testid={`history-booking-type-${booking.id}`}>
                            {booking.bookingType}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right space-y-1 ml-4 flex flex-col items-end">
                        <p className="font-bold text-lg text-[#29b24a]" data-testid={`history-booking-total-${booking.id}`}>
                          ${booking.totalAmount}
                        </p>
                        <Badge variant={getStatusColor(booking.status)} data-testid={`history-booking-status-${booking.id}`}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                    {booking.driverId && (booking.driverFirstName || booking.driverLastName) && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-start space-x-2">
                          <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium" data-testid={`history-booking-driver-name-${booking.id}`}>
                              Driver: {booking.driverFirstName} {booking.driverLastName}
                            </p>
                            {booking.driverPhone && (
                              <p className="text-xs text-muted-foreground" data-testid={`history-booking-driver-phone-${booking.id}`}>
                                📞 {booking.driverPhone}
                              </p>
                            )}
                            {booking.driverCredentials && (
                              <p className="text-xs text-muted-foreground" data-testid={`history-booking-driver-credentials-${booking.id}`}>
                                {booking.driverCredentials}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditBooking(booking)}
                            data-testid={`button-edit-history-${booking.id}`}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBooking(booking)}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            data-testid={`button-delete-history-${booking.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                      {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelBooking(booking)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          data-testid={`button-cancel-history-${booking.id}`}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Cancel Booking
                        </Button>
                      )}
                      {booking.status === 'completed' && booking.driverId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBookingForRating(booking);
                            setRatingDialogOpen(true);
                          }}
                          data-testid={`button-rate-driver-${booking.id}`}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Rate Driver
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground" data-testid="history-no-bookings">
                No bookings found. Start your first ride with us!
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#ffffff]">
          <DialogHeader>
            <DialogTitle>Rate Your Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                How was your ride experience?
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                    data-testid={`rating-star-${star}`}
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-sm font-medium">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating-comment">Additional Comments (Optional)</Label>
              <Input
                id="rating-comment"
                placeholder="Share your experience..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                data-testid="input-rating-comment"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRatingDialogOpen(false);
                  setRating(0);
                  setRatingComment('');
                }}
                data-testid="button-cancel-rating"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedBookingForRating) {
                    submitRatingMutation.mutate({
                      bookingId: selectedBookingForRating.id,
                      rating,
                      comment: ratingComment || undefined,
                    });
                  }
                }}
                disabled={rating === 0 || submitRatingMutation.isPending}
                data-testid="button-submit-rating"
              >
                {submitRatingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#ffffff]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="bg-muted rounded-lg p-4 my-4">
              <p className="text-sm font-medium mb-1">
                {selectedBooking.pickupAddress} → {selectedBooking.destinationAddress || 'Hourly Service'}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedBooking.scheduledDateTime).toLocaleDateString()} • {new Date(selectedBooking.scheduledDateTime).toLocaleTimeString()}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedBooking) {
                  deleteBookingMutation.mutate(selectedBooking.id);
                }
              }}
              disabled={deleteBookingMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteBookingMutation.isPending ? 'Deleting...' : 'Delete Booking'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={(open) => {
        setCancelDialogOpen(open);
        if (!open) setCancelReason('');
      }}>
        <DialogContent className="sm:max-w-[450px] bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>
              Please select a reason for cancellation. This helps us improve our service.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="bg-muted rounded-lg p-4 border border-border">
              <p className="text-sm font-medium mb-1 text-foreground">
                {selectedBooking.pickupAddress} → {selectedBooking.destinationAddress || 'Hourly Service'}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedBooking.scheduledDateTime).toLocaleDateString()} • {new Date(selectedBooking.scheduledDateTime).toLocaleTimeString()}
              </p>
            </div>
          )}
          <div className="space-y-3 py-2">
            <Label className="text-sm font-medium text-foreground">Reason for cancellation</Label>
            <div className="grid grid-cols-2 gap-2">
              {cancellationReasons.map((reason) => (
                <Button
                  key={reason}
                  type="button"
                  variant={cancelReason === reason ? "default" : "outline"}
                  size="sm"
                  className={`h-9 text-xs justify-start ${
                    cancelReason === reason 
                      ? 'btn-brand-primary' 
                      : 'border-border hover:bg-muted'
                  }`}
                  onClick={() => setCancelReason(reason)}
                  data-testid={`reason-${reason.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {reason}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason('');
              }}
              data-testid="button-cancel-cancel"
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedBooking && cancelReason) {
                  cancelBookingMutation.mutate({ 
                    id: selectedBooking.id, 
                    reason: cancelReason 
                  });
                }
              }}
              disabled={cancelBookingMutation.isPending || !cancelReason}
              data-testid="button-confirm-cancel"
            >
              {cancelBookingMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <EditBookingDialog
        booking={selectedBooking}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
        }}
      />

      {/* Booking Payment Dialog */}
      <Dialog open={bookingPaymentDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setBookingPaymentDialogOpen(false);
          setPaymentBooking(null);
          setBookingClientSecret(null);
          setBookingPaymentProvider(null);
          setBookingSquareConfig(null);
        }
      }}>
        <DialogContent className="sm:max-w-[450px] bg-card p-5">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold text-foreground">Pay for Booking</DialogTitle>
            {paymentBooking && (
              <p className="text-sm text-muted-foreground">
                {paymentBooking.pickupAddress?.slice(0, 30)}... - ${parseFloat(paymentBooking.totalAmount).toFixed(2)}
              </p>
            )}
          </DialogHeader>
          
          {createBookingPaymentMutation.isPending ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full" />
              <span className="ml-3 text-sm text-muted-foreground">Preparing payment...</span>
            </div>
          ) : bookingPaymentProvider === 'stripe' && bookingClientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret: bookingClientSecret }}>
              <BookingPaymentForm 
                bookingId={paymentBooking?.id}
                amount={paymentBooking?.totalAmount}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
                  setBookingPaymentDialogOpen(false);
                  setPaymentBooking(null);
                  setBookingClientSecret(null);
                  setBookingPaymentProvider(null);
                  toast({
                    title: "Payment Successful",
                    description: "Your booking has been paid successfully.",
                  });
                }}
                onCancel={() => {
                  setBookingPaymentDialogOpen(false);
                  setPaymentBooking(null);
                  setBookingClientSecret(null);
                  setBookingPaymentProvider(null);
                }}
              />
            </Elements>
          ) : bookingPaymentProvider === 'square' && bookingSquareConfig ? (
            <SquareBookingPaymentForm 
              bookingId={paymentBooking?.id}
              amount={paymentBooking?.totalAmount}
              applicationId={bookingSquareConfig.applicationId}
              locationId={bookingSquareConfig.locationId}
              environment={bookingSquareConfig.environment}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
                setBookingPaymentDialogOpen(false);
                setPaymentBooking(null);
                setBookingSquareConfig(null);
                setBookingPaymentProvider(null);
              }}
              onCancel={() => {
                setBookingPaymentDialogOpen(false);
                setPaymentBooking(null);
                setBookingSquareConfig(null);
                setBookingPaymentProvider(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
