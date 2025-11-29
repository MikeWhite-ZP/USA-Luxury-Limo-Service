import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";

export default function Booking() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Book Your <span className="text-primary">Luxury</span> Transportation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience premium comfort and reliability with our professional chauffeur services.
              Complete your booking details below.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <BookingForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}