import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Plane, 
  Users, 
  Calendar,
  Phone,
  Mail,
  Clock,
  Star,
  Navigation
} from "lucide-react";

export default function Locations() {
  const [, setLocation] = useLocation();

  const primaryLocations = [
    {
      name: "Houston, TX",
      description: "Experience the heart of luxury with our Houston limo services. Perfect for airport transfers, corporate events, and nights out in the city.",
      icon: <Building2 className="w-8 h-8" />,
      highlights: ["Downtown District", "Medical Center", "Energy Corridor", "Museum District"]
    },
    {
      name: "Katy, TX", 
      description: "Providing elegant and comfortable rides for all occasions in Katy. Trust our professional chauffeurs for your next special event or airport trip.",
      icon: <Users className="w-8 h-8" />,
      highlights: ["Katy Mills", "Cinco Ranch", "West Houston", "Grand Parkway"]
    },
    {
      name: "Sugar Land, TX",
      description: "Luxury transportation in Sugar Land for business travel, prom nights, and more. Ride in style and arrive on time every time.",
      icon: <Star className="w-8 h-8" />,
      highlights: ["Town Square", "First Colony", "Riverstone", "Telfair"]
    },
    {
      name: "The Woodlands, TX",
      description: "Premium black car service in The Woodlands. Whether it's a corporate meeting or a private celebration, we'll get you there with class.",
      icon: <Navigation className="w-8 h-8" />,
      highlights: ["Market Street", "Hughes Landing", "Research Forest", "Grogan's Mill"]
    },
    {
      name: "Cypress, TX",
      description: "Explore Cypress with our luxury SUVs and black cars. Your comfort and safety are our top priorities on every ride.",
      icon: <MapPin className="w-8 h-8" />,
      highlights: ["Northwest Harris County", "Willowbrook", "Fairfield", "Bridgeland"]
    },
    {
      name: "Tomball, TX",
      description: "Small-town charm meets luxury transportation. Known for its historic charm, family-friendly events, and warm sense of community.",
      icon: <Clock className="w-8 h-8" />,
      highlights: ["Historic Downtown", "Tomball Depot", "Spring Creek", "Klein Area"]
    },
    {
      name: "Pearland, TX",
      description: "A thriving city located just south of Houston, known for its friendly community, excellent amenities, and growing economy. Whether you're celebrating a wedding, planning a corporate event, or need a luxurious airport transfer, we provide premium transportation services.",
      icon: <Building2 className="w-8 h-8" />,
      highlights: ["Pearland Town Center", "South Houston", "Alvin Area", "Friendswood Border"]
    }
  ];

  const featuredAreas = [
    {
      name: "Downtown Houston",
      title: "Luxury Transportation & Attractions",
      description: "Downtown Houston, TX, serves as the bustling heart of the city, offering a dynamic blend of cultural attractions, dining experiences, and vibrant entertainment options. From historic landmarks to modern skyscrapers, this district is a must-visit destination for locals and tourists alike.",
      features: ["Theater District", "Historic District", "Financial District", "Convention Center"],
      image: "🏢"
    },
    {
      name: "The Galleria/Uptown",
      title: "Shopping & Business Hub", 
      description: "The Galleria area represents Houston's premier shopping and business district, featuring luxury retail, fine dining, and corporate headquarters. This upscale area demands transportation that matches its sophisticated atmosphere.",
      features: ["Galleria Mall", "Uptown District", "Corporate Centers", "Fine Dining"],
      image: "🛍️"
    },
  ];

  const extendedAreas = [
    {
      name: "College Station, TX",
      description: "A Hub of Education and Culture. Home of Texas A&M University with a blend of rich history, cultural activities, and modern attractions.",
      services: ["University Events", "Academic Transportation", "Research Facility Access"]
    },
    {
      name: "Port Arthur, TX", 
      description: "Where history meets the Gulf Coast. A charming waterfront city with rich cultural heritage and stunning natural beauty.",
      services: ["Industrial Transportation", "Port Services", "Business Travel"]
    },
    {
      name: "Friendswood, TX",
      description: "Top-tier black car and chauffeur services throughout Friendswood and the surrounding Greater Houston area.",
      services: ["Airport Transfers", "Special Occasions", "Corporate Travel"]
    }
  ];

  const serviceTypes = [
    {
      icon: <Plane className="w-6 h-6" />,
      title: "Airport Transfers",
      description: "Reliable transportation to/from Houston airports (IAH, HOU)"
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: "Corporate Events", 
      description: "Professional transportation for business meetings and events"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Special Occasions",
      description: "Luxury transportation for weddings, proms, and celebrations"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Hourly Service",
      description: "Flexible hourly rates for extended transportation needs"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="from-primary to-primary/80 text-white py-16 bg-[#23252f]">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <MapPin className="w-16 h-16 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="locations-page-title">
                Service Locations
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto" data-testid="locations-page-description">
                Serving Houston and Beyond with Premium Black Car & Chauffeur Services
              </p>
            </div>
          </div>
        </section>

        {/* Primary Service Areas */}
        <section className="py-16 dark:bg-gray-900 bg-[#ffffff]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" data-testid="primary-locations-title">
                Primary Service Areas
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Our core service areas throughout the Greater Houston metropolitan region
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {primaryLocations.map((location, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full text-primary">
                        {location.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl" data-testid={`primary-location-${index}-title`}>
                      {location.name}
                    </CardTitle>
                    <CardDescription data-testid={`primary-location-${index}-description`}>
                      {location.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Key Areas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {location.highlights.map((highlight, highlightIndex) => (
                          <span 
                            key={highlightIndex}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                            data-testid={`primary-location-${index}-highlight-${highlightIndex}`}
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Areas */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" data-testid="featured-areas-title">
                Featured Areas
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Specialized service areas with unique transportation needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {featuredAreas.map((area, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{area.image}</span>
                      <div>
                        <CardTitle className="text-xl" data-testid={`featured-area-${index}-name`}>
                          {area.name}
                        </CardTitle>
                        <CardDescription className="font-medium" data-testid={`featured-area-${index}-title`}>
                          {area.title}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-4" data-testid={`featured-area-${index}-description`}>
                      {area.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {area.features.map((feature, featureIndex) => (
                        <div 
                          key={featureIndex}
                          className="flex items-center space-x-2 text-sm"
                          data-testid={`featured-area-${index}-feature-${featureIndex}`}
                        >
                          <Star className="w-3 h-3 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Extended Service Areas */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" data-testid="extended-areas-title">
                Extended Service Areas
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Additional locations we proudly serve with premium transportation
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {extendedAreas.map((area, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg" data-testid={`extended-area-${index}-name`}>
                      {area.name}
                    </CardTitle>
                    <CardDescription data-testid={`extended-area-${index}-description`}>
                      {area.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {area.services.map((service, serviceIndex) => (
                        <div 
                          key={serviceIndex}
                          className="flex items-center justify-center space-x-2 text-sm"
                          data-testid={`extended-area-${index}-service-${serviceIndex}`}
                        >
                          <Navigation className="w-3 h-3 text-primary" />
                          <span>{service}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Service Types */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" data-testid="service-types-title">
                Transportation Services
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Comprehensive luxury transportation services across all our locations
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {serviceTypes.map((service, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-primary/10 rounded-full text-primary">
                        {service.icon}
                      </div>
                    </div>
                    <CardTitle className="text-lg" data-testid={`service-type-${index}-title`}>
                      {service.title}
                    </CardTitle>
                    <CardDescription data-testid={`service-type-${index}-description`}>
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact for Service */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4" data-testid="contact-service-title">
              Ready to Book Your Ride?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto" data-testid="contact-service-description">
              Contact us to book luxury transportation to any of our service locations. Available 24/7 for your convenience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setLocation('/booking')}
                className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                data-testid="contact-booking-button"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Now
              </Button>
              <a 
                href="mailto:usaluxurylimo@gmail.com"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors inline-flex items-center justify-center"
                data-testid="contact-email-button"
              >
                <Mail className="w-5 h-5 mr-2" />
                Email Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}