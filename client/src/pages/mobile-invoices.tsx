import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { generateInvoiceHTML } from '@/lib/invoiceTemplate';
import { useBranding } from '@/hooks/useBranding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FileText, ArrowLeft, Eye, Printer, Mail, Receipt, Search, Calendar, X } from 'lucide-react';

export default function MobileInvoices() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { companyName, logoUrl } = useBranding();

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  const filteredInvoices = invoices?.filter(invoice => {
    // Text search filter
    const matchesSearch = !searchQuery || 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.booking?.pickupAddress?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date range filter
    const invoiceDate = new Date(invoice.createdAt);
    const matchesStartDate = !startDate || invoiceDate >= new Date(startDate);
    const matchesEndDate = !endDate || invoiceDate <= new Date(endDate + 'T23:59:59');
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  }) || [];

  const hasActiveFilters = searchQuery || startDate || endDate;

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

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
    const booking = invoice.booking;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const passengerName = booking?.passengerFirstName && booking?.passengerLastName 
      ? `${booking.passengerFirstName} ${booking.passengerLastName}`
      : booking?.passengerName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Guest';
    
    const printContent = generateInvoiceHTML({
      logoUrl,
      companyName,
      invoiceNumber: invoice.invoiceNumber,
      booking: {
        confirmationNumber: booking?.confirmationNumber || invoice.invoiceNumber,
        scheduledDateTime: booking?.scheduledDateTime || invoice.createdAt,
        createdAt: invoice.createdAt,
        passengerCount: booking?.passengerCount || 1,
        vehicleType: booking?.vehicleTypeName || booking?.vehicleType,
        vehicleName: booking?.vehicleName,
        driverName: booking?.driverName,
        driverPhone: booking?.driverPhone,
        passengerName,
        passengerFirstName: booking?.passengerFirstName,
        passengerLastName: booking?.passengerLastName,
        passengerPhone: booking?.passengerPhone || user?.phone,
        passengerEmail: booking?.passengerEmail || user?.email,
        passengerAddress: booking?.passengerAddress,
        pickupAddress: booking?.pickupAddress || 'N/A',
        destinationAddress: booking?.destinationAddress,
        bookingType: booking?.bookingType,
        requestedHours: booking?.requestedHours,
        paymentMethod: booking?.paymentMethod,
        status: booking?.status,
        notes: booking?.notes,
        specialRequests: booking?.specialInstructions,
        baseFare: booking?.baseFare,
        totalFare: invoice.totalAmount || booking?.totalFare,
        gratuityAmount: booking?.gratuityAmount,
        surgePricingAmount: booking?.surgePricingAmount,
        surgePricingMultiplier: booking?.surgePricingMultiplier,
        airportFeeAmount: booking?.airportFeeAmount,
        discountAmount: booking?.discountAmount,
        discountPercentage: booking?.discountPercentage,
        tollFees: booking?.tollFees,
        parkingFees: booking?.parkingFees,
        extraStopFees: booking?.extraStopFees,
        waitTimeFees: booking?.waitTimeFees,
        creditAmountApplied: booking?.creditAmountApplied,
        paidAmount: invoice.paidAt ? invoice.totalAmount : '0',
        taxAmount: booking?.taxAmount,
      }
    });

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
            onClick={() => navigate('/mobile-passenger')}
            className="text-white hover:bg-primary-foreground/20 dark:bg-primary-foreground/25"
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
      <div className="px-4 -mt-6 mb-4">
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

      {/* Date Range Filters */}
      <div className="px-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-slate-900">Filter by Date</span>
            </div>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                className="h-7 px-2 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50"
                data-testid="button-clear-filters"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start-date" className="text-xs text-slate-600 mb-1.5 block">From</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-sm border-slate-300"
                data-testid="input-start-date"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs text-slate-600 mb-1.5 block">To</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-sm border-slate-300"
                data-testid="input-end-date"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <span>📅</span>
              {startDate && endDate ? (
                <span>Showing invoices from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</span>
              ) : startDate ? (
                <span>Showing invoices from {new Date(startDate).toLocaleDateString()} onwards</span>
              ) : (
                <span>Showing invoices up to {new Date(endDate).toLocaleDateString()}</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Invoices List */}
      <div className="px-4 space-y-3">
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
            <Card key={invoice.id} className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900 text-sm" data-testid={`invoice-number-${invoice.id}`}>
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-slate-600" data-testid={`invoice-date-${invoice.id}`}>
                        {new Date(invoice.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-700" data-testid={`invoice-amount-${invoice.id}`}>
                        ${parseFloat(invoice.totalAmount).toFixed(2)}
                      </p>
                      <span
                        className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
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
                    <div className="text-xs space-y-0.5">
                      <p className="text-slate-600 leading-tight">
                        <span className="font-medium text-slate-900">From:</span> {invoice.booking.pickupAddress}
                      </p>
                      {invoice.booking.destinationAddress && (
                        <p className="text-slate-600 leading-tight">
                          <span className="font-medium text-slate-900">To:</span> {invoice.booking.destinationAddress}
                        </p>
                      )}
                      <p className="text-slate-600 leading-tight">
                        <span className="font-medium text-slate-900">ID:</span> #{invoice.bookingId.toUpperCase().substring(0, 8)}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-1.5 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(invoice)}
                      className="flex-1 h-7 text-indigo-700 border-indigo-300 hover:bg-indigo-50 text-[10px] px-1"
                      data-testid={`button-view-${invoice.id}`}
                    >
                      <Eye className="w-3 h-3 mr-0.5" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrint(invoice)}
                      className="flex-1 h-7 text-slate-700 border-slate-300 hover:bg-slate-50 text-[10px] px-1"
                      data-testid={`button-print-${invoice.id}`}
                    >
                      <Printer className="w-3 h-3 mr-0.5" />
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(invoice)}
                      disabled={isLoadingEmail}
                      className="flex-1 h-7 text-blue-700 border-blue-300 hover:bg-blue-50 text-[10px] px-1"
                      data-testid={`button-email-${invoice.id}`}
                    >
                      <Mail className="w-3 h-3 mr-0.5" />
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
