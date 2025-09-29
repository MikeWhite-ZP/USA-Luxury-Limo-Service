import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useParams } from "wouter";
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Plane, 
  Calendar,
  Mail,
  Clock,
  Star,
  Navigation,
  Car,
  Users,
  Shield
} from "lucide-react";

export default function FeaturedAreaDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const areaSlug = params.slug;

  const featuredAreasData = {
    "downtown-houston": {
      name: "Downtown Houston",
      title: "Luxury Transportation & Attractions",
      description: "Downtown Houston, TX, serves as the bustling heart of the city, offering a dynamic blend of cultural attractions, dining experiences, and vibrant entertainment options. From historic landmarks to modern skyscrapers, this district is a must-visit destination for locals and tourists alike.",
      image: "🏢",
      heroDescription: "Experience the pulse of Houston's vibrant downtown district with our premium luxury transportation services. From the towering skyscrapers of the financial district to the world-renowned Theater District, we provide sophisticated transportation solutions that match the energy and elegance of this iconic urban center.",
      highlights: [
        "Theater District - Home to world-class performing arts venues",
        "Historic District - Preserved architecture and cultural landmarks",
        "Financial District - Corporate headquarters and business centers", 
        "Convention Center - Major events and conferences",
        "Downtown Aquarium - Family entertainment destination",
        "Minute Maid Park - Professional baseball stadium",
        "Toyota Center - Premier sports and entertainment venue",
        "Market Square Park - Urban green space and events"
      ],
      services: [
        {
          icon: <Building2 className="w-6 h-6" />,
          title: "Corporate Transportation",
          description: "Executive transportation for business meetings, client visits, and corporate events in the financial district."
        },
        {
          icon: <Star className="w-6 h-6" />,
          title: "Theater & Entertainment",
          description: "Elegant arrivals for shows, concerts, and cultural events at downtown venues."
        },
        {
          icon: <Users className="w-6 h-6" />,
          title: "Convention Services",
          description: "Group transportation and logistics for conferences, trade shows, and large events."
        },
        {
          icon: <Car className="w-6 h-6" />,
          title: "Downtown Dining",
          description: "Sophisticated transportation to Houston's finest restaurants and culinary experiences."
        }
      ]
    },
    "galleria-uptown": {
      name: "The Galleria/Uptown",
      title: "Shopping & Business Hub",
      description: "The Galleria area represents Houston's premier shopping and business district, featuring luxury retail, fine dining, and corporate headquarters. This upscale area demands transportation that matches its sophisticated atmosphere.",
      image: "🛍️",
      heroDescription: "Navigate Houston's most prestigious shopping and business district with our luxury transportation services. The Galleria/Uptown area combines world-class retail therapy with corporate excellence, and our premium black car service ensures you arrive in style whether for business or pleasure.",
      highlights: [
        "The Galleria Mall - Premier shopping destination",
        "Uptown District - Luxury high-rise living and dining",
        "Corporate Centers - Major business headquarters",
        "Fine Dining - Award-winning restaurants and cuisine",
        "Post Oak Boulevard - Luxury retail corridor",
        "Williams Tower - Iconic Houston landmark", 
        "Uptown Park - Outdoor shopping and entertainment",
        "River Oaks District - Ultra-luxury shopping center"
      ],
      services: [
        {
          icon: <Star className="w-6 h-6" />,
          title: "Luxury Shopping",
          description: "Premium transportation for high-end shopping experiences and personal shopping appointments."
        },
        {
          icon: <Building2 className="w-6 h-6" />,
          title: "Business Meetings",
          description: "Executive transportation to corporate offices and business centers in the Uptown district."
        },
        {
          icon: <Car className="w-6 h-6" />,
          title: "Fine Dining Transport",
          description: "Elegant transportation to Houston's most prestigious restaurants and culinary destinations."
        },
        {
          icon: <Users className="w-6 h-6" />,
          title: "VIP Experiences",
          description: "Concierge-level transportation for exclusive events and luxury lifestyle services."
        }
      ]
    },
    "city-center": {
      name: "City Center Houston",
      title: "Modern Urban Living & Entertainment",
      description: "City Center Houston represents the pinnacle of modern urban development, featuring luxury high-rise living, premium shopping, world-class dining, and vibrant nightlife. This mixed-use development offers an unparalleled urban lifestyle experience in the heart of Houston.",
      image: "🌆",
      heroDescription: "Discover the future of urban luxury at City Center Houston with our premier transportation services. This modern mixed-use development embodies sophistication and convenience, offering residents and visitors an integrated lifestyle experience that deserves equally refined transportation solutions.",
      highlights: [
        "High-End Residences - Luxury condominiums and apartments",
        "Premium Shopping - Boutique stores and designer outlets",
        "Fine Dining - Gourmet restaurants and culinary experiences",
        "Entertainment Venues - Nightlife and social destinations",
        "City Centre - Open-air shopping and dining plaza",
        "Memorial City Mall - Major retail shopping center",
        "Bear Creek Pioneers Park - Outdoor recreation and events",
        "CityCentre Plaza - Central gathering space and events"
      ],
      services: [
        {
          icon: <Building2 className="w-6 h-6" />,
          title: "Residential Services",
          description: "Dedicated transportation for City Center residents and their guests with personalized service."
        },
        {
          icon: <Star className="w-6 h-6" />,
          title: "Entertainment Transport",
          description: "Safe and sophisticated transportation for nightlife, dining, and entertainment experiences."
        },
        {
          icon: <Car className="w-6 h-6" />,
          title: "Shopping Assistance",
          description: "Convenient transportation for shopping trips with assistance for packages and purchases."
        },
        {
          icon: <Users className="w-6 h-6" />,
          title: "Event Transportation",
          description: "Group transportation for community events, gatherings, and special occasions."
        }
      ]
    }
  };

  const currentArea = featuredAreasData[areaSlug as keyof typeof featuredAreasData];

  if (!currentArea) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Area Not Found</h1>
            <p className="text-xl text-gray-600 mb-8">The requested area could not be found.</p>
            <Button onClick={() => setLocation('/locations')} data-testid="back-to-locations-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Locations
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary text-white py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20"></div>
          <div className="relative container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/locations')}
                className="text-white hover:text-white hover:bg-white/20 mb-8 self-start"
                data-testid="back-to-locations-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Locations
              </Button>
              
              <div className="flex items-center justify-center mb-8">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <span className="text-6xl">{currentArea.image}</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent" data-testid="area-name">
                {currentArea.name}
              </h1>
              <p className="text-xl font-semibold text-white/90 mb-6" data-testid="area-title">
                {currentArea.title}
              </p>
              <p className="text-lg text-white/80 leading-relaxed max-w-3xl mx-auto" data-testid="area-hero-description">
                {currentArea.heroDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Area Highlights */}
        <section className="py-20 bg-gradient-to-br from-gray-50/50 to-primary/5 dark:from-gray-900/50 dark:to-primary/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="highlights-title">
                Area Highlights
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Discover the key attractions and destinations that make {currentArea.name} a premier location
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {currentArea.highlights.map((highlight, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <p className="font-medium text-sm leading-relaxed" data-testid={`highlight-${index}`}>
                      {highlight}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Transportation Services */}
        <section className="py-20 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="services-title">
                Transportation Services
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Specialized luxury transportation services tailored for {currentArea.name}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {currentArea.services.map((service, index) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                  <CardHeader className="p-8">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform duration-300">
                        {service.icon}
                      </div>
                      <CardTitle className="text-xl font-bold" data-testid={`service-${index}-title`}>
                        {service.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-base leading-relaxed" data-testid={`service-${index}-description`}>
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-secondary text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20"></div>
          <div className="relative container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-8">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6" data-testid="cta-title">
              Book Your Luxury Transportation
            </h2>
            <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed" data-testid="cta-description">
              Experience {currentArea.name} with our premium black car service. Available 24/7 for your convenience.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
              <Button 
                onClick={() => setLocation('/booking')}
                className="group bg-white text-primary px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                data-testid="book-now-button"
              >
                <Calendar className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                Book Now
              </Button>
              <a 
                href="mailto:usaluxurylimo@gmail.com"
                className="group border-2 border-white/50 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-primary transition-all duration-300 inline-flex items-center justify-center backdrop-blur-sm hover:border-white hover:shadow-xl hover:-translate-y-1"
                data-testid="contact-email-button"
              >
                <Mail className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}