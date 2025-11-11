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
      services: ["Game Day Transportation", "Concert Shuttles", "VIP Event Service"],
      icon: "🏟️",
      category: "Sports & Entertainment"
    },
    {
      name: "Toyota Center", 
      description: "Downtown arena hosting Houston Rockets NBA games, concerts, and entertainment events. Premium venue requiring sophisticated transportation solutions.",
      services: ["NBA Game Transport", "Concert Services", "Corporate Events"],
      icon: "🏀",
      category: "Sports & Entertainment"
    },
    {
      name: "Daikin Park",
      description: "Houston Dynamo FC soccer stadium and major sports venue. Modern facility hosting MLS games, tournaments, and special events.",
      services: ["Soccer Game Transport", "Tournament Shuttles", "Special Events"],
      icon: "⚽",
      category: "Sports & Entertainment"
    },
    {
      name: "George R. Brown Convention Center",
      description: "Houston's premier convention and exhibition facility. Major venue for trade shows, conferences, and large-scale business events.",
      services: ["Convention Transport", "Trade Show Shuttles", "Business Events"],
      icon: "🏢",
      category: "Business & Events"
    },
    {
      name: "Houston Zoo",
      description: "One of the most popular family destinations in Houston. World-class zoo featuring diverse exhibits and educational programs.",
      services: ["Family Outings", "Group Tours", "Special Events"],
      icon: "🦁",
      category: "Family & Recreation"
    },
    {
      name: "Space Center Houston",
      description: "NASA's official visitor center and Houston's premier space attraction. Interactive exhibits and tours showcasing space exploration.",
      services: ["Educational Tours", "Group Transportation", "VIP Experiences"],
      icon: "🚀",
      category: "Education & Culture"
    },
    {
      name: "Houston Museum District",
      description: "Home to 19 museums including the Museum of Fine Arts, Natural Science Museum, and Children's Museum. Cultural hub of Houston.",
      services: ["Cultural Tours", "Educational Transport", "Museum Events"],
      icon: "🎨",
      category: "Education & Culture"
    },
    {
      name: "Rice University",
      description: "Prestigious private university with beautiful campus and major academic and cultural events throughout the year.",
      services: ["Academic Events", "Campus Tours", "Graduation Services"],
      icon: "🎓",
      category: "Education & Culture"
    },
    {
      name: "Hermann Park",
      description: "Houston's premier urban park featuring gardens, lake, golf course, and outdoor attractions. Popular destination for events and recreation.",
      services: ["Event Transportation", "Recreation Shuttles", "Park Tours"],
      icon: "🌳",
      category: "Family & Recreation"
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
        {/* Hero Section - Modern Design */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black text-white py-24">
          {/* Decorative Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"></div>
          
          <div className="relative container mx-auto px-4">
            <div className="text-center max-w-5xl mx-auto">
              {/* Icon Badge */}
              <div className="inline-flex items-center justify-center mb-8">
                <div className="p-5 bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl">
                  <MapPin className="w-16 h-16 text-white" />
                </div>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold mb-6" data-testid="locations-page-title">
                <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                  Service Locations
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8" data-testid="locations-page-description">
                Serving Houston and Beyond with Premium Black Car & Chauffeur Services
              </p>

              {/* Stats Bar */}
              <div className="flex flex-wrap justify-center gap-8 mt-12">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">24/7</div>
                  <div className="text-sm text-slate-400 mt-1">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">7+</div>
                  <div className="text-sm text-slate-400 mt-1">Service Areas</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">100%</div>
                  <div className="text-sm text-slate-400 mt-1">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Service Areas - Enhanced Design */}
        <section className="py-20 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full mb-4">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent" data-testid="primary-locations-title">
                Primary Service Areas
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Our core service areas throughout the Greater Houston metropolitan region
              </p>
            </div>

            {/* Location Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {primaryLocations.map((location, index) => (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Top Accent */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  
                  <CardHeader className="text-center pb-4">
                    {/* Icon Container */}
                    <div className="flex justify-center mb-6">
                      <div className="relative p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          {location.icon}
                        </div>
                      </div>
                    </div>
                    
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-300 mb-3" data-testid={`primary-location-${index}-title`}>
                      {location.name}
                    </CardTitle>
                    
                    <CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed" data-testid={`primary-location-${index}-description`}>
                      {location.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Key Areas */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center">
                        <div className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full mr-2"></div>
                        Key Areas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {location.highlights.map((highlight, highlightIndex) => (
                          <span 
                            key={highlightIndex}
                            className="px-3 py-1.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-full font-medium border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all duration-200"
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

        {/* Featured Areas - Modern Cards */}
        <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-full mb-4">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-amber-600 to-slate-900 dark:from-white dark:via-amber-400 dark:to-white bg-clip-text text-transparent" data-testid="featured-areas-title">
                Featured Areas
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Specialized service areas with unique transportation needs and premium luxury experiences
              </p>
            </div>

            {/* Featured Area Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {featuredAreas.map((area, index) => (
                <Card 
                  key={index} 
                  className="group overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                  onClick={() => setLocation(`/locations/${area.slug}`)}
                  data-testid={`featured-area-card-${area.slug}`}
                >
                  {/* Header with Icon */}
                  <CardHeader className="relative bg-gradient-to-br from-amber-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-slate-200 dark:border-slate-700">
                        {area.image}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300" data-testid={`featured-area-${index}-name`}>
                          {area.name}
                        </CardTitle>
                        <CardDescription className="font-semibold text-amber-600 dark:text-amber-400 mt-1" data-testid={`featured-area-${index}-title`}>
                          {area.title}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed" data-testid={`featured-area-${index}-description`}>
                      {area.description}
                    </p>
                    
                    {/* Features List */}
                    <div className="space-y-2">
                      {area.features.map((feature, featureIndex) => (
                        <div 
                          key={featureIndex}
                          className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-200"
                          data-testid={`featured-area-${index}-feature-${featureIndex}`}
                        >
                          <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                            <Star className="w-3 h-3 text-amber-500" />
                          </div>
                          <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Explore Link */}
                    <div className="mt-6 flex items-center text-amber-600 dark:text-amber-400 font-semibold text-sm group-hover:gap-2 transition-all duration-300">
                      <span>Click to explore</span>
                      <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Houston Destinations */}
        <section className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full mb-4">
                <Navigation className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-blue-600 to-slate-900 dark:from-white dark:via-blue-400 dark:to-white bg-clip-text text-transparent" data-testid="extended-areas-title">
                Popular Houston Destinations
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Premium luxury transportation to Houston's most sought-after venues and attractions
              </p>
            </div>

            {/* Destination Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {extendedAreas.map((area, index) => (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2"
                >
                  {/* Category Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold rounded-full shadow-lg">
                      {area.category}
                    </span>
                  </div>

                  {/* Header */}
                  <CardHeader className="relative bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="text-4xl p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-slate-200 dark:border-slate-700">
                          {area.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-2">
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" data-testid={`extended-area-${index}-name`}>
                          {area.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Content */}
                  <CardContent className="p-6">
                    <CardDescription className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed" data-testid={`extended-area-${index}-description`}>
                      {area.description}
                    </CardDescription>
                    
                    {/* Services */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-2"></div>
                        Transportation Services
                      </h4>
                      <div className="space-y-2">
                        {area.services.map((service, serviceIndex) => (
                          <div 
                            key={serviceIndex}
                            className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 group/service"
                            data-testid={`extended-area-${index}-service-${serviceIndex}`}
                          >
                            <div className="flex-shrink-0 p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover/service:scale-110 transition-transform duration-200">
                              <Navigation className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                              {service}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Transportation Services */}
        <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full mb-4">
                <Plane className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-primary to-slate-900 dark:from-white dark:via-primary dark:to-white bg-clip-text text-transparent" data-testid="service-types-title">
                Transportation Services
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Comprehensive luxury transportation services across all our locations with premium amenities
              </p>
            </div>

            {/* Service Type Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {serviceTypes.map((service, index) => (
                <Card 
                  key={index} 
                  className="group text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2"
                >
                  <CardHeader className="p-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="relative p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          {service.icon}
                        </div>
                      </div>
                    </div>
                    
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-300 mb-3" data-testid={`service-type-${index}-title`}>
                      {service.title}
                    </CardTitle>
                    
                    <CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed" data-testid={`service-type-${index}-description`}>
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action - Modern Design */}
        <section className="relative py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black text-white overflow-hidden">
          {/* Decorative Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20"></div>
          
          {/* Decorative Blurs */}
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
          
          <div className="relative container mx-auto px-4 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-8 shadow-2xl">
              <Calendar className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold mb-6" data-testid="contact-service-title">
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                Ready to Book Your Ride?
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed" data-testid="contact-service-description">
              Contact us to book luxury transportation to any of our service locations. Available 24/7 for your convenience.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
              <Button 
                onClick={() => setLocation('/booking')}
                className="group bg-white text-slate-900 px-10 py-6 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all duration-300 shadow-2xl hover:shadow-white/20 hover:-translate-y-1"
                data-testid="contact-booking-button"
              >
                <Calendar className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                Book Now
              </Button>
              
              <a 
                href="mailto:usaluxurylimo@gmail.com"
                className="group border-2 border-white/30 text-white px-10 py-6 rounded-xl font-bold text-lg hover:bg-white hover:text-slate-900 transition-all duration-300 inline-flex items-center justify-center backdrop-blur-sm hover:border-white hover:shadow-2xl hover:-translate-y-1"
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
