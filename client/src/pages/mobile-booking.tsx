import BookingForm from '@/components/BookingForm';

export default function MobileBooking() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 dark:from-background dark:via-background dark:to-primary/5 transition-colors duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <BookingForm />
      </div>
    </div>
  );
}
