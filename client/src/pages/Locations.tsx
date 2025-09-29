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
      image: "🏢",
      slug: "downtown-houston"
    },
    {
      name: "The Galleria/Uptown",
      title: "Shopping & Business Hub", 
      description: "The Galleria area represents Houston's premier shopping and business district, featuring luxury retail, fine dining, and corporate headquarters. This upscale area demands transportation that matches its sophisticated atmosphere.",
      features: ["Galleria Mall", "Uptown District", "Corporate Centers", "Fine Dining"],
      image: "🛍️",
      slug: "galleria-uptown"
    },
    {
      name: "City Center Houston",
      title: "Modern Urban Living & Entertainment",
      description: "City Center Houston represents the pinnacle of modern urban development, featuring luxury high-rise living, premium shopping, world-class dining, and vibrant nightlife. This mixed-use development offers an unparalleled urban lifestyle experience in the heart of Houston.",
      features: ["High-End Residences", "Premium Shopping", "Fine Dining", "Entertainment Venues"],
      image: "🌆",
      slug: "city-center"
    },
  ];

  const extendedAreas = [
    {
      name: "NRG Stadium",
      description: "Home of the Houston Texans NFL team and major events. Premier sports and entertainment venue hosting football games, concerts, and large-scale events.",
      services: ["Game Day Transportation", "Concert Shuttles", "VIP Event Service"]
    },
    {
      name: "Toyota Center", 
      description: "Downtown arena hosting Houston Rockets NBA games, concerts, and entertainment events. Premium venue requiring sophisticated transportation solutions.",
      services: ["NBA Game Transport", "Concert Services", "Corporate Events"]
    },
    {
      name: "Daikin Park",
      description: "Houston Dynamo FC soccer stadium and major sports venue. Modern facility hosting MLS games, tournaments, and special events.",
      services: ["Soccer Game Transport", "Tournament Shuttles", "Special Events"]
    },
    {
      name: "George R. Brown Convention Center",
      description: "Houston's premier convention and exhibition facility. Major venue for trade shows, conferences, and large-scale business events.",
      services: ["Convention Transport", "Trade Show Shuttles", "Business Events"]
    },
    {
      name: "Houston Zoo",
      description: "One of the most popular family destinations in Houston. World-class zoo featuring diverse exhibits and educational programs.",
      services: ["Family Outings", "Group Tours", "Special Events"]
    },
    {
      name: "Space Center Houston",
      description: "NASA's official visitor center and Houston's premier space attraction. Interactive exhibits and tours showcasing space exploration.",
      services: ["Educational Tours", "Group Transportation", "VIP Experiences"]
    },
    {
      name: "Houston Museum District",
      description: "Home to 19 museums including the Museum of Fine Arts, Natural Science Museum, and Children's Museum. Cultural hub of Houston.",
      services: ["Cultural Tours", "Educational Transport", "Museum Events"]
    },
    {
      name: "Rice University",
      description: "Prestigious private university with beautiful campus and major academic and cultural events throughout the year.",
      services: ["Academic Events", "Campus Tours", "Graduation Services"]
    },
    {
      name: "Hermann Park",
      description: "Houston's premier urban park featuring gardens, lake, golf course, and outdoor attractions. Popular destination for events and recreation.",
      services: ["Event Transportation", "Recreation Shuttles", "Park Tours"]
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
        <section className="relative overflow-hidden from-primary to-primary/80 text-white py-20 bg-gradient-to-br bg-[#23252f]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/30"></div>
          <div className="relative container mx-auto px-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-8 animate-pulse">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <MapPin className="w-20 h-20 text-white drop-shadow-lg" />
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent drop-shadow-2xl" data-testid="locations-page-title">
                Service Locations
              </h1>
              <p className="text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-light" data-testid="locations-page-description">
                Serving Houston and Beyond with Premium Black Car & Chauffeur Services
              </p>
              <div className="mt-8 flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {primaryLocations.map((location, index) => (
                <Card key={index} className="group relative overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  <CardHeader className="text-center pb-6 relative">
                    <div className="flex justify-center mb-6">
                      <div className="relative p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                        <div className="relative z-10">
                          {location.icon}
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors duration-300" data-testid={`primary-location-${index}-title`}>
                      {location.name}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed mt-3" data-testid={`primary-location-${index}-description`}>
                      {location.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                        Key Areas:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {location.highlights.map((highlight, highlightIndex) => (
                          <span 
                            key={highlightIndex}
                            className="px-3 py-2 bg-gradient-to-r from-primary/15 to-secondary/15 text-primary text-sm rounded-full font-medium hover:from-primary/25 hover:to-secondary/25 transition-all duration-200 cursor-default"
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
        <section className="py-20 bg-gradient-to-br from-gray-50/50 to-primary/5 dark:from-gray-900/50 dark:to-primary/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-primary bg-clip-text text-transparent dark:from-white dark:to-primary" data-testid="featured-areas-title">
                Featured Areas
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Specialized service areas with unique transportation needs and premium luxury experiences
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {featuredAreas.map((area, index) => (
                <Card 
                  key={index} 
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-white/95 backdrop-blur-sm hover:-translate-y-1 cursor-pointer"
                  onClick={() => setLocation(`/locations/${area.slug}`)}
                  data-testid={`featured-area-card-${area.slug}`}
                >
                  <CardHeader className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-6">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative flex items-center space-x-4 mb-3">
                      <div className="text-3xl p-3 bg-white/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        {area.image}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300" data-testid={`featured-area-${index}-name`}>
                          {area.name}
                        </CardTitle>
                        <CardDescription className="font-semibold text-base text-primary/80" data-testid={`featured-area-${index}-title`}>
                          {area.title}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-base leading-relaxed" data-testid={`featured-area-${index}-description`}>
                      {area.description}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {area.features.map((feature, featureIndex) => (
                        <div 
                          key={featureIndex}
                          className="flex items-center space-x-2 p-2 bg-gradient-to-r from-primary/5 to-transparent rounded-lg hover:from-primary/10 transition-all duration-200"
                          data-testid={`featured-area-${index}-feature-${featureIndex}`}
                        >
                          <div className="p-1 bg-primary/20 rounded-full">
                            <Star className="w-3 h-3 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center text-primary font-semibold text-sm group-hover:text-primary/80 transition-colors duration-300">
                      <span>Click to explore</span>
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Extended Service Areas */}
        <section className="py-20 bg-gradient-to-br from-gray-100/80 to-primary/5 dark:from-gray-900/80 dark:to-primary/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
                <Navigation className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-primary bg-clip-text text-transparent dark:from-white dark:to-primary" data-testid="extended-areas-title">
                Extended Service Areas
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Additional locations we proudly serve with premium transportation services and luxury experiences
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
        <section className="py-20 bg-gradient-to-br from-white to-primary/5 dark:from-gray-950 dark:to-primary/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-primary bg-clip-text text-transparent dark:from-white dark:to-primary" data-testid="service-types-title">
                Transportation Services
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Comprehensive luxury transportation services across all our locations with premium amenities
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {serviceTypes.map((service, index) => (
                <Card key={index} className="group text-center hover:shadow-2xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm hover:-translate-y-2">
                  <CardHeader className="p-8">
                    <div className="flex justify-center mb-6">
                      <div className="relative p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                        <div className="relative z-10">
                          {service.icon}
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300 mb-3" data-testid={`service-type-${index}-title`}>
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed" data-testid={`service-type-${index}-description`}>
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact for Service */}
        <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-secondary text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/8 rounded-full blur-lg"></div>
          </div>
          <div className="relative container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-8">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent" data-testid="contact-service-title">
              Ready to Book Your Ride?
            </h2>
            <p className="text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed font-light" data-testid="contact-service-description">
              Contact us to book luxury transportation to any of our service locations. Available 24/7 for your convenience.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
              <Button 
                onClick={() => setLocation('/booking')}
                className="group bg-white text-primary px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                data-testid="contact-booking-button"
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