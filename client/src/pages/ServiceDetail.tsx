import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plane, Briefcase, Heart, Clock, Star, Check, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import airportTransferBg from "@assets/67dc52e7ef277_1759125789879.webp";
import corporateTravelBg from "@assets/corporate_1759126654203.webp";
import specialEventsBg from "@assets/event_1759126933449.webp";

const serviceData = {
  "airport-transfer": {
    icon: Plane,
    title: "Airport Transfer",
    description: "Reliable airport pickup and drop-off with flight tracking and meet & greet service.",
    features: ["Flight tracking", "Meet & greet", "Free waiting time"],
    backgroundImage: airportTransferBg,
    detailedDescription: "Our airport transfer service ensures you arrive at your destination on time and in comfort. We monitor your flight status to adjust pickup times automatically, and our professional chauffeurs provide meet and greet service at the terminal.",
    benefits: [
      "Real-time flight tracking for pickup adjustments",
      "Professional meet and greet at arrivals",
      "Complimentary 30-minute waiting time",
      "Assistance with luggage handling",
      "Direct route to your destination",
      "Child seats available upon request"
    ]
  },
  "corporate-travel": {
    icon: Briefcase,
    title: "Corporate Travel",
    description: "Professional transportation for business meetings, events, and executive travel.",
    features: ["Business-class vehicles", "Professional chauffeurs", "Corporate billing"],
    backgroundImage: corporateTravelBg,
    detailedDescription: "Enhance your business image with our executive transportation services. Perfect for client meetings, corporate events, and executive travel with professional vehicles and experienced chauffeurs.",
    benefits: [
      "Fleet of executive-class vehicles",
      "Experienced professional chauffeurs",
      "Corporate billing and invoicing",
      "Confidentiality and discretion assured",
      "Wi-Fi connectivity available",
      "Flexible scheduling for business needs"
    ]
  },
  "special-events": {
    icon: Heart,
    title: "Special Events",
    description: "Make your special occasions memorable with our luxury transportation services.",
    features: ["Wedding packages", "Prom & graduation", "Anniversary celebrations"],
    backgroundImage: specialEventsBg,
    detailedDescription: "Celebrate life's special moments with our luxury transportation services. Whether it's your wedding day, prom night, or anniversary celebration, we ensure your transportation is as memorable as the occasion.",
    benefits: [
      "Wedding ceremony and reception transportation",
      "Prom and graduation celebrations",
      "Anniversary and special occasion packages",
      "Decorated vehicles available",
      "Photography coordination",
      "Multiple stops included"
    ]
  },
  "hourly-service": {
    icon: Clock,
    title: "Hourly Service",
    description: "Flexible hourly transportation for multiple stops, shopping trips, and extended travel needs.",
    features: ["Flexible scheduling", "Multiple destinations", "Wait time included", "Customizable routes"],
    backgroundImage: corporateTravelBg,
    detailedDescription: "Our hourly service provides the ultimate flexibility for your transportation needs. Perfect for shopping trips, multiple business meetings, sightseeing tours, or any occasion requiring transportation with multiple stops.",
    benefits: [
      "Minimum 3-hour booking available",
      "Unlimited stops within the time frame",
      "Waiting time included in hourly rate",
      "Customizable routes and schedules",
      "Same professional chauffeur throughout",
      "Perfect for shopping, tours, and multiple meetings"
    ]
  }
};

export default function ServiceDetail() {
  const [, params] = useRoute("/service/:id");
  const [, setLocation] = useLocation();
  const serviceId = params?.id as keyof typeof serviceData;

  if (!serviceId || !serviceData[serviceId]) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Service Not Found</h1>
            <p className="text-muted-foreground mb-6">The service you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const service = serviceData[serviceId];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        {/* Hero Section */}
        <div 
          className="relative h-64 bg-cover bg-center"
          style={{ backgroundImage: `url('${service.backgroundImage}')` }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="text-white">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/#services')}
                className="text-white hover:text-white hover:bg-white/20 mb-4"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Services
              </Button>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold" data-testid="service-title">
                    {service.title}
                  </h1>
                  <p className="text-xl text-white/90" data-testid="service-description">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Service Details */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Service Overview
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed" data-testid="detailed-description">
                  {service.detailedDescription}
                </p>
              </div>

              {/* Benefits */}
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  What's Included
                </h2>
                <div className="grid gap-3">
                  {service.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-primary mt-0.5" />
                      <span className="text-muted-foreground" data-testid={`benefit-${index}`}>
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Card */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center">
                    <Star className="w-6 h-6 mr-2 text-primary" />
                    Book This Service
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    <p className="text-muted-foreground">
                      Ready to experience luxury transportation? Book our {service.title.toLowerCase()} service today.
                    </p>
                    
                    {/* Service Features */}
                    <div className="border-t border-border pt-4">
                      <h4 className="font-semibold text-foreground mb-3">Key Features:</h4>
                      <div className="space-y-2">
                        {service.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-primary" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      className="w-full text-lg py-6"
                      onClick={() => setLocation(`/booking?service=${serviceId}`)}
                      data-testid="button-book-service"
                    >
                      Book Now
                    </Button>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Need help or have questions?
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation('/#contact')}
                        data-testid="button-contact"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Contact Us
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-4">Available 24/7</h4>
                  <p className="text-sm text-muted-foreground">
                    Our luxury transportation services are available around the clock. 
                    Book online or call us for immediate assistance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}