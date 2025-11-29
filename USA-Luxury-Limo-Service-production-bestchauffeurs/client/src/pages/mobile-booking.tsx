import BookingForm from '@/components/BookingForm';
import { useLocation } from 'wouter';
import { ArrowLeft, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MobileBooking() {
  const [, navigate] = useLocation();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-gray-100 pb-6">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/mobile-passenger')}
              className="h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl touch-manipulation"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">New Booking</h1>
                <p className="text-gray-500 text-xs">Book your next ride</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full px-4 py-4">
        <BookingForm />
      </div>
    </div>
  );
}
