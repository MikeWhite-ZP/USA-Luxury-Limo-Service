import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MobileBookingDetails() {
  const [, navigate] = useLocation();
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/mobile-passenger')}
        className="mb-6"
        data-testid="button-back"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Dashboard
      </Button>

      <div className="text-center py-12">
        <Construction className="w-24 h-24 mx-auto mb-6 text-blue-600 opacity-50" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Booking Details</h1>
        <p className="text-gray-600 max-w-md mx-auto mb-2">
          Detailed booking view and edit functionality is coming soon.
        </p>
        <p className="text-sm text-gray-500">Booking ID: {id}</p>
      </div>
    </div>
  );
}
