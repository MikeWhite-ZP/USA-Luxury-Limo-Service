import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
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

export default function FleetSection() {
  const { data: vehicleTypes, isLoading } = useQuery<VehicleType[]>({
    queryKey: ['/api/vehicle-types'],
  });
  const [, setLocation] = useLocation();

  const getVehicleImage = (vehicleName: string) => {
    const lowerName = vehicleName.toLowerCase();
    
    // Specific vehicle type matching for unique images
    if (lowerName === 'business sedan') {
      return sedanImage;
    } else if (lowerName === 'first-class sedan') {
      return firstClassSedanImage; // Use Mercedes-Maybach for premium sedan
    } else if (lowerName === 'business suv') {
      return suburbanImage; // Suburban for business SUV
    } else if (lowerName === 'first-class suv') {
      return cadillacImage; // Cadillac for first-class SUV
    } else if (lowerName.includes('van') || lowerName.includes('business van')) {
      return businessVanImage;
    } else if (lowerName.includes('sedan')) {
      return sedanImage; // Fallback for other sedans
    } else if (lowerName.includes('suv') || lowerName.includes('suburban')) {
      return suburbanImage; // Fallback for other SUVs
    } else if (lowerName.includes('cadillac') || lowerName.includes('escalade')) {
      return cadillacImage;
    } else {
      return cadillacImage; // Default to Cadillac for premium vehicles
    }
  };

  if (isLoading) {
    return (
      <section id="fleet" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="fleet" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4" data-testid="fleet-title">
            Our Luxury Fleet
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="fleet-description">
            Choose from our premium selection of vehicles, each maintained to the highest standards of luxury and safety.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicleTypes?.map((vehicle, index) => (
            <div 
              key={vehicle.id}
              className="vehicle-card bg-card rounded-xl overflow-hidden shadow-lg"
              data-testid={`vehicle-card-${index}`}
            >
              <div 
                className="aspect-video bg-cover bg-center"
                style={{
                  backgroundImage: `url('${vehicle.imageUrl || getVehicleImage(vehicle.name)}')`
                }}
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-card-foreground mb-4" data-testid={`vehicle-name-${index}`}>
                  {vehicle.name}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex justify-between">
                    <span>Passengers:</span>
                    <span data-testid={`vehicle-passengers-${index}`}>Up to {vehicle.passengerCapacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Luggage:</span>
                    <span data-testid={`vehicle-luggage-${index}`}>{vehicle.luggageCapacity}</span>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => setLocation(`/vehicle/${vehicle.id}`)}
                  data-testid={`button-select-vehicle-${index}`}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
