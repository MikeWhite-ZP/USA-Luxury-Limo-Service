import BookingForm from '@/components/BookingForm';

export default function MobileBooking() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <BookingForm />
      </div>
    </div>
  );
}
