import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@shared/schema';
import { format, parseISO } from 'date-fns';

interface InvoiceWithBooking extends Invoice {
  booking?: {
    pickupAddress: string;
    destinationAddress?: string;
    scheduledDateTime: string;
  };
}

export default function MobileInvoices() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch invoices
  const { data: invoices, isLoading } = useQuery<InvoiceWithBooking[]>({
    queryKey: ['/api/invoices'],
  });

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      // Generate PDF (this would call a backend endpoint to generate PDF)
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF Downloaded',
        description: `Invoice ${invoice.invoiceNumber} has been downloaded`,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Could not download invoice PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/mobile-passenger')}
            className="text-white hover:bg-blue-500/20 mr-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </div>
        <h1 className="text-2xl font-bold flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          My Invoices
        </h1>
        <p className="text-blue-100 mt-1">View and download your invoices</p>
      </div>

      <div className="p-6 space-y-4">
        {!invoices || invoices.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent className="pt-6">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Invoices Yet</h3>
              <p className="text-gray-500 mb-4">
                Your invoices will appear here after completing bookings.
              </p>
              <Button
                onClick={() => navigate('/mobile-booking')}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-new-booking"
              >
                Book a Ride
              </Button>
            </CardContent>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice.id} className="overflow-hidden" data-testid={`invoice-card-${invoice.id}`}>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Invoice #{invoice.invoiceNumber}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {format(
                        typeof invoice.createdAt === 'string' 
                          ? parseISO(invoice.createdAt) 
                          : invoice.createdAt || new Date(),
                        'MMM d, yyyy'
                      )}
                    </p>                  </div>
                  <Badge className={invoice.paidAt ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {invoice.paidAt ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {/* Trip Details */}
                {invoice.booking && (
                  <div className="text-sm">
                    <p className="text-gray-600 mb-1">Trip Details:</p>
                    <p className="font-medium text-gray-900">{invoice.booking.pickupAddress}</p>
                    {invoice.booking.destinationAddress && (
                      <>
                        <p className="text-gray-400 text-xs my-1">↓</p>
                        <p className="font-medium text-gray-900">{invoice.booking.destinationAddress}</p>
                      </>
                    )}
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium" data-testid={`subtotal-${invoice.id}`}>
                      ${parseFloat(invoice.subtotal as string).toFixed(2)}
                    </span>
                  </div>
                  {parseFloat(invoice.taxAmount as string) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">
                        ${parseFloat(invoice.taxAmount as string).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-blue-600" data-testid={`total-${invoice.id}`}>
                      ${parseFloat(invoice.totalAmount as string).toFixed(2)}
                    </span>
                  </div>
                </div>

                {invoice.paidAt && (
                  <p className="text-xs text-gray-500">
                    Paid on {format(
                      typeof invoice.paidAt === 'string' 
                        ? parseISO(invoice.paidAt) 
                        : invoice.paidAt,
                      'MMM d, yyyy'
                    )}
                  </p>
                )}

                {/* Download Button */}
                <Button
                  onClick={() => handleDownloadPDF(invoice)}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                  data-testid={`button-download-${invoice.id}`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
