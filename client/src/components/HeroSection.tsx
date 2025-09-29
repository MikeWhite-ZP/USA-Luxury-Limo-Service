import BookingForm from "@/components/BookingForm";
import heroBackground from "@assets/khalid_1759128435991.webp";

export default function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{
          backgroundImage: `url(${heroBackground})`
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center text-justify">
          {/* Hero Content */}
          <div className="text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" data-testid="hero-title">
              Premium 
              <span className="text-primary"> Luxury</span>
              <br />Transportation
            </h1>
            <p className="text-xl mb-8 text-gray-200 max-w-lg" data-testid="hero-description">
              Experience unparalleled comfort and reliability with our professional chauffeur services. 
              Available 24/7 for all your transportation needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-gray-900 transition-all"
                onClick={() => document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-view-fleet"
              >
                View Fleet
              </button>
            </div>
          </div>

          {/* Booking Form Widget */}
          <div id="hero-booking" className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl pl-[10px] pr-[10px] pt-[10px] pb-[10px] w-[70%]">
            <h3 className="text-2xl font-bold text-gray-900 mb-6" data-testid="booking-form-title">
              Quick Booking
            </h3>
            <BookingForm />
          </div>
        </div>
      </div>
    </section>
  );
}
