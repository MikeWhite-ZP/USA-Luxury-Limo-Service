import { useLocation } from 'wouter';
import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MobileBooking() {
  const [, navigate] = useLocation();

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

      <div className="text-center py-12">
        <Construction className="w-24 h-24 mx-auto mb-6 text-green-600 opacity-50" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Mobile Booking</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          The mobile booking interface is coming soon. For now, please use the desktop version to create new bookings.
        </p>
        <Button
          onClick={() => navigate('/booking')}
          className="mt-6"
          data-testid="button-desktop-booking"
        >
          Use Desktop Booking
        </Button>
      </div>
    </div>
  );
}
