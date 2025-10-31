import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FileText, ArrowLeft, Eye, Printer, Mail, Receipt, Search } from 'lucide-react';

export default function MobileInvoices() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);

  // Fetch passenger invoices
  const { data: invoices, isLoading } = useQuery<any[]>({
    queryKey: ['/api/passenger/invoices'],
  });

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
      setEmailDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invoice email',
        variant: 'destructive',
      });
    },
  });

  const filteredInvoices = invoices?.filter(invoice => 
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.booking?.pickupAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleView = (invoice: any) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleEmail = (invoice: any) => {
    setSelectedInvoice(invoice);
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
    let booking = invoice.booking;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let pricingRows = '';
    
    if (booking?.baseFare) {
      pricingRows += `
        <div class="pricing-row">
          <span class="pricing-label">Base Fare</span>
          <span class="pricing-value">$${parseFloat(booking.baseFare).toFixed(2)}</span>
        </div>
      `;
    }
    
    if (booking?.surgePricingAmount && parseFloat(booking.surgePricingAmount) > 0) {
      const multiplier = booking.surgePricingMultiplier ? ` (${booking.surgePricingMultiplier}x)` : '';
      pricingRows += `
        <div class="pricing-row">
          <span class="pricing-label">Surge Pricing${multiplier}</span>
          <span class="pricing-value pricing-surge">+$${parseFloat(booking.surgePricingAmount).toFixed(2)}</span>
        </div>
      `;
    }
    
    if (booking?.gratuityAmount && parseFloat(booking.gratuityAmount) > 0) {
      pricingRows += `
        <div class="pricing-row">
          <span class="pricing-label">Gratuity (Tip)</span>
          <span class="pricing-value">+$${parseFloat(booking.gratuityAmount).toFixed(2)}</span>
        </div>
      `;
    }
    
    if (booking?.airportFeeAmount && parseFloat(booking.airportFeeAmount) > 0) {
      pricingRows += `
        <div class="pricing-row">
          <span class="pricing-label">Airport Fee</span>
          <span class="pricing-value">+$${parseFloat(booking.airportFeeAmount).toFixed(2)}</span>
        </div>
      `;
    }
    
    if (booking?.discountAmount && parseFloat(booking.discountAmount) > 0) {
      const percentage = booking.discountPercentage ? ` (${booking.discountPercentage}%)` : '';
      pricingRows += `
        <div class="pricing-row">
          <span class="pricing-label">Discount${percentage}</span>
          <span class="pricing-value pricing-discount">-$${parseFloat(booking.discountAmount).toFixed(2)}</span>
        </div>
      `;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 48px; 
            max-width: 850px; 
            margin: 0 auto;
            background: #ffffff;
            color: #0f172a;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 24px; 
            margin-bottom: 40px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 32px;
            border-radius: 12px;
          }
          .header h1 { 
            font-size: 36px;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .header .invoice-number { 
            font-size: 18px;
            color: #4f46e5;
            font-weight: 600;
            margin-top: 12px;
          }
          .info-section {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
          }
          .info-section h2 {
            font-size: 16px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 15px;
            color: #0f172a;
            font-weight: 600;
          }
          .booking-id {
            font-family: 'Courier New', monospace;
            background: #cbd5e1;
            padding: 4px 12px;
            border-radius: 6px;
            display: inline-block;
          }
          .pricing-section {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
          }
          .pricing-section h2 {
            font-size: 16px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .pricing-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .pricing-row:last-child {
            border-bottom: none;
          }
          .pricing-label {
            font-size: 15px;
            color: #0f172a;
            font-weight: 500;
          }
          .pricing-value {
            font-size: 15px;
            color: #0f172a;
            font-weight: 600;
          }
          .pricing-surge {
            color: #ea580c;
          }
          .pricing-discount {
            color: #16a34a;
          }
          .total-section {
            background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
            border: 3px solid #3b82f6;
            border-radius: 12px;
            padding: 24px;
            margin-top: 24px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            font-size: 20px;
            color: #0f172a;
            font-weight: 700;
          }
          .total-value {
            font-size: 28px;
            color: #1d4ed8;
            font-weight: 800;
          }
          .payment-status {
            text-align: center;
            margin-top: 32px;
            padding: 20px;
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 3px solid #10b981;
            border-radius: 12px;
          }
          .payment-status-text {
            color: #065f46;
            font-weight: 800;
            font-size: 20px;
            letter-spacing: 2px;
          }
          .footer {
            margin-top: 48px;
            padding-top: 24px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
          }
          .footer p {
            color: #64748b;
            font-size: 13px;
            font-weight: 500;
          }
          .footer .thank-you {
            font-size: 16px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 8px;
          }
          @media print {
            body { 
              padding: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>USA Luxury Limo</h1>
          <div class="invoice-number">Invoice #${invoice.invoiceNumber}</div>
        </div>
        
        <div class="info-section">
          <h2>Invoice Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Invoice Date</span>
              <span class="info-value">${new Date(invoice.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Booking ID</span>
              <span class="info-value booking-id">#${invoice.bookingId.toUpperCase().substring(0, 8)}</span>
            </div>
            ${invoice.paidAt ? `
              <div class="info-item">
                <span class="info-label">Payment Date</span>
                <span class="info-value">${new Date(invoice.paidAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${booking ? `
        <div class="info-section">
          <h2>🚗 Journey Information</h2>
          <div class="info-grid">
            <div class="info-item" style="grid-column: span 2;">
              <span class="info-label">From :</span>
              <span class="info-value">${booking.pickupAddress}</span>
            </div>
            ${booking.bookingType === 'hourly' && booking.requestedHours ? `
            <div class="info-item" style="grid-column: span 2;">
              <span class="info-label">Duration:</span>
              <span class="info-value">${booking.requestedHours} ${booking.requestedHours === 1 ? 'Hour' : 'Hours'}</span>
            </div>
            ` : booking.destinationAddress ? `
            <div class="info-item" style="grid-column: span 2;">
              <span class="info-label">Destination:</span>
              <span class="info-value">${booking.destinationAddress}</span>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
        
        <div class="pricing-section">
          <h2>📋 Detailed Pricing Breakdown</h2>
          ${pricingRows || `
            <div class="pricing-row">
              <span class="pricing-label">Journey Fare</span>
              <span class="pricing-value">$${parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
          `}
          
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Total Amount</span>
              <span class="total-value">$${parseFloat(invoice.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        ${invoice.paidAt ? `
          <div class="payment-status">
            <div class="payment-status-text">✓ PAYMENT RECEIVED</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <p class="thank-you">Thank you for choosing USA Luxury Limo!</p>
          <p>All prices include statutory taxes and transportation expenses</p>
        </div>
        
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (!user) {
    navigate('/mobile-login?role=passenger');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/passenger')}
            className="text-white hover:bg-white/20"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Invoices</h1>
            <p className="text-blue-100 text-sm mt-1">View and manage your ride invoices</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 -mt-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by invoice number or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white shadow-md border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="px-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-600 mt-4">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <Card className="border-slate-200 bg-white shadow-md">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900">No invoices found</h3>
                <p className="text-sm text-slate-600">
                  {searchQuery ? "Try adjusting your search terms" : "Invoices will appear here once your rides are complete"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="border-slate-200 bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900 text-lg" data-testid={`invoice-number-${invoice.id}`}>
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-slate-600" data-testid={`invoice-date-${invoice.id}`}>
                        {new Date(invoice.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-700" data-testid={`invoice-amount-${invoice.id}`}>
                        ${parseFloat(invoice.totalAmount).toFixed(2)}
                      </p>
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-full font-semibold ${
                          invoice.paidAt
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                        data-testid={`invoice-status-${invoice.id}`}
                      >
                        {invoice.paidAt ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>

                  {invoice.booking && (
                    <div className="text-sm space-y-1">
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-900">From:</span> {invoice.booking.pickupAddress}
                      </p>
                      {invoice.booking.destinationAddress && (
                        <p className="text-slate-600">
                          <span className="font-medium text-slate-900">To:</span> {invoice.booking.destinationAddress}
                        </p>
                      )}
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-900">Booking ID:</span> #{invoice.bookingId.toUpperCase().substring(0, 8)}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(invoice)}
                      className="flex-1 h-10 text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                      data-testid={`button-view-${invoice.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrint(invoice)}
                      className="flex-1 h-10 text-slate-700 border-slate-300 hover:bg-slate-50"
                      data-testid={`button-print-${invoice.id}`}
                    >
                      <Printer className="w-4 h-4 mr-1.5" />
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(invoice)}
                      disabled={isLoadingEmail}
                      className="flex-1 h-10 text-blue-700 border-blue-300 hover:bg-blue-50"
                      data-testid={`button-email-${invoice.id}`}
                    >
                      <Mail className="w-4 h-4 mr-1.5" />
                      {isLoadingEmail ? "..." : "Email"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Invoice Details</DialogTitle>
                <p className="text-sm text-slate-600 mt-0.5">Complete pricing breakdown</p>
              </div>
            </div>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-indigo-100 p-1.5 rounded-lg">
                    <FileText className="w-4 h-4 text-indigo-700" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">Invoice Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1.5 font-medium">Invoice Number</p>
                    <p className="font-bold text-slate-900" data-testid="view-invoice-number">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-1.5 font-medium">Date</p>
                    <p className="text-slate-900" data-testid="view-invoice-date">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-600 mb-1.5 font-medium">Booking ID</p>
                    <p className="font-mono text-sm bg-slate-200 text-slate-900 px-3 py-1.5 rounded-lg inline-block" data-testid="view-booking-id">
                      #{selectedInvoice.bookingId.toUpperCase().substring(0, 8)}
                    </p>
                  </div>
                  {selectedInvoice.paidAt && (
                    <div className="col-span-2">
                      <p className="text-slate-600 mb-1.5 font-medium">Payment Date</p>
                      <p className="text-slate-900" data-testid="view-payment-date">{new Date(selectedInvoice.paidAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <Receipt className="w-4 h-4 text-blue-700" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">Detailed Pricing Breakdown</h3>
                </div>
                <div className="space-y-3">
                  {selectedInvoice.booking?.baseFare && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-slate-900 font-medium">Base Fare</span>
                      <span className="font-semibold text-slate-900" data-testid="view-base-fare">
                        ${parseFloat(selectedInvoice.booking.baseFare).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {selectedInvoice.booking?.surgePricingAmount && parseFloat(selectedInvoice.booking.surgePricingAmount) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-medium">Surge Pricing</span>
                        {selectedInvoice.booking?.surgePricingMultiplier && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                            {selectedInvoice.booking.surgePricingMultiplier}x
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-orange-600" data-testid="view-surge-pricing">
                        +${parseFloat(selectedInvoice.booking.surgePricingAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {selectedInvoice.booking?.gratuityAmount && parseFloat(selectedInvoice.booking.gratuityAmount) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-slate-900 font-medium">Gratuity (Tip)</span>
                      <span className="font-semibold text-slate-900" data-testid="view-gratuity">
                        +${parseFloat(selectedInvoice.booking.gratuityAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {selectedInvoice.booking?.airportFeeAmount && parseFloat(selectedInvoice.booking.airportFeeAmount) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-slate-900 font-medium">Airport Fee</span>
                      <span className="font-semibold text-slate-900" data-testid="view-airport-fee">
                        +${parseFloat(selectedInvoice.booking.airportFeeAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {selectedInvoice.booking?.discountAmount && parseFloat(selectedInvoice.booking.discountAmount) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-medium">Discount</span>
                        {selectedInvoice.booking?.discountPercentage && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                            {selectedInvoice.booking.discountPercentage}%
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-green-600" data-testid="view-discount">
                        -${parseFloat(selectedInvoice.booking.discountAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 -mx-4 rounded-lg mt-3 border-t-2 border-blue-200">
                    <span className="font-bold text-lg text-slate-900">Total Amount</span>
                    <span className="font-bold text-xl text-blue-700" data-testid="view-total">
                      ${parseFloat(selectedInvoice.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedInvoice.paidAt && (
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-green-600 p-1.5 rounded-full">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-800 font-bold text-lg">PAYMENT RECEIVED</p>
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500 text-center pt-2 bg-slate-50 py-3 rounded-lg border border-slate-200">
                <p className="font-medium">💡 All prices include statutory taxes and transportation expenses</p>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-slate-200 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setViewDialogOpen(false)} 
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
              data-testid="button-close-view"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
