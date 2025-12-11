import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/hooks/useBranding';
import BookingForm from '@/components/BookingForm';

export default function MobileBooking() {
  const [, navigate] = useLocation();
  const { companyName, logoUrl } = useBranding();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header with Logo and Back Button */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/mobile-passenger')}
                className="text-gray-700 hover:bg-gray-100 touch-manipulation -ml-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt={companyName} 
                  className="h-8 w-auto object-contain"
                />
              )}
            </div>
            <div className="text-right">
              <h1 className="text-lg font-semibold text-gray-900">Book New Ride</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="w-full px-4 py-4">
        <BookingForm />
      </div>
    </div>
  );
}
