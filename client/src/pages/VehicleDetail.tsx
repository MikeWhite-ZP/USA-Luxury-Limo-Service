import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users, Luggage, Car, Shield, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import sedanImage from "@assets/sedan_1759156477839.webp";
import firstClassSedanImage from "@assets/first_class_sedan_1759157052869.webp";
import suburbanImage from "@assets/suburban_1759127172845.webp";
import cadillacImage from "@assets/cadillac_1759128022490.png";
import businessVanImage from "@assets/BusinessVAN_1759127962518.webp";

interface VehicleType {
  id: string;
  name: string;
  hourlyRate: string;
  passengerCapacity: number;
  luggageCapacity: string;
  imageUrl?: string;
  description?: string;
}

export default function VehicleDetail() {
  const [, params] = useRoute("/vehicle/:id");
  const vehicleId = params?.id;

  const { data: vehicleTypes, isLoading } = useQuery<VehicleType[]>({
    queryKey: ['/api/vehicle-types'],
  });

  const getVehicleImage = (vehicleName: string) => {
    const lowerName = vehicleName.toLowerCase();
    
    if (lowerName === 'business sedan') {
      return sedanImage;
    } else if (lowerName === 'first-class sedan') {
      return firstClassSedanImage;
    } else if (lowerName === 'business suv') {
      return suburbanImage;
    } else if (lowerName === 'first-class suv') {
      return cadillacImage;
    } else if (lowerName.includes('van') || lowerName.includes('business van')) {
      return businessVanImage;
    } else if (lowerName.includes('sedan')) {
      return sedanImage;
    } else if (lowerName.includes('suv') || lowerName.includes('suburban')) {
      return suburbanImage;
    } else if (lowerName.includes('cadillac') || lowerName.includes('escalade')) {
      return cadillacImage;
    } else {
      return cadillacImage;
    }
  };

  const vehicle = vehicleTypes?.find(v => v.id === vehicleId);

  const getVehicleFeatures = (vehicleName: string) => {
    const lowerName = vehicleName.toLowerCase();
    
    if (lowerName.includes('first-class')) {
      return [
        "Premium leather interior",
        "Climate control",
        "Complimentary refreshments",
        "Professional chauffeur",
        "Wi-Fi connectivity",
        "Phone charging stations",
        "Luxury amenities",
        "Privacy partition"
      ];
    } else if (lowerName.includes('business')) {
      return [
        "Professional service",
        "Climate control",
        "Comfortable seating",
        "Experienced driver",
        "Wi-Fi connectivity",
        "Phone charging stations",
        "Clean and maintained",
        "Punctual service"
      ];
    } else {
      return [
        "Professional service",
        "Climate control",
        "Comfortable seating",
        "Experienced driver",
        "Clean and maintained",
        "Punctual service"
      ];
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Vehicle Not Found</h1>
            <p className="text-muted-foreground mb-6">The vehicle you're looking for doesn't exist.</p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const features = getVehicleFeatures(vehicle.name);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Fleet
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Vehicle Image */}
            <div className="space-y-6">
              <div 
                className="aspect-video bg-cover bg-center rounded-xl shadow-lg"
                style={{
                  backgroundImage: `url('${vehicle.imageUrl || getVehicleImage(vehicle.name)}')`
                }}
                data-testid="vehicle-detail-image"
              />
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Passengers</p>
                    <p className="font-semibold" data-testid="detail-passengers">Up to {vehicle.passengerCapacity}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Luggage className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Luggage</p>
                    <p className="font-semibold" data-testid="detail-luggage">{vehicle.luggageCapacity}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="vehicle-detail-name">
                  {vehicle.name}
                </h1>
                <p className="text-lg text-muted-foreground" data-testid="vehicle-detail-description">
                  {vehicle.description || "Experience luxury transportation with our premium vehicle service. Professional, reliable, and comfortable."}
                </p>
              </div>

              {/* Features */}
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-primary" />
                  Features & Amenities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-sm" data-testid={`feature-${index}`}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety & Quality */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-primary" />
                    Safety & Quality Assurance
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Licensed and insured professional drivers</li>
                    <li>• Regular vehicle maintenance and safety inspections</li>
                    <li>• GPS tracking for enhanced security</li>
                    <li>• 24/7 customer support available</li>
                    <li>• Comprehensive background checks for all drivers</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Book Now Button */}
              <div className="space-y-4">
                <Button 
                  className="w-full text-lg py-6"
                  onClick={() => window.location.href = '/booking'}
                  data-testid="button-book-vehicle"
                >
                  <Car className="w-5 h-5 mr-2" />
                  Book This Vehicle
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Pricing available during booking process
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}