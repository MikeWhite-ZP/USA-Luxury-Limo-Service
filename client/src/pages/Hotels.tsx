import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Building2, 
  Star, 
  Users, 
  Calendar,
  Mail,
  Clock,
  Shield,
  Car,
  Plane,
  MapPin,
  Phone,
  CheckCircle,
  Crown
} from "lucide-react";

export default function Hotels() {
  const [, setLocation] = useLocation();

  const hotelServices = [
    {
      icon: <Plane className="w-8 h-8" />,
      title: "Airport Transfers",
      description: "Seamless transportation for hotel guests to and from Houston airports (IAH, HOU) with meet-and-greet services."
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "Hotel Concierge Services",
      description: "Partner with hotel concierge teams to provide premium transportation for guests attending events, meetings, and attractions."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Group Transportation",
      description: "Coordinated transportation solutions for hotel events, conferences, and large group bookings with multiple vehicles."
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "VIP Guest Services",
      description: "Exclusive luxury transportation for high-profile guests, celebrities, and VIP hotel patrons requiring discretion and premium service."
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Event Transportation",
      description: "Specialized transportation for hotel-hosted events including weddings, corporate functions, and special celebrations."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "24/7 On-Call Service",
      description: "Round-the-clock availability for hotels requiring immediate transportation solutions for their guests."
    }
  ];

  const hotelPartners = [
    {
      name: "Luxury Hotels",
      description: "Five-star hotels and resorts",
      features: ["Dedicated concierge liaison", "VIP guest protocols", "Luxury vehicle fleet", "White-glove service"]
    },
    {
      name: "Business Hotels",
      description: "Corporate and business travel accommodations",
      features: ["Executive transportation", "Airport scheduling", "Meeting transfers", "Corporate billing"]
    },
    {
      name: "Boutique Hotels",
      description: "Unique and specialty accommodations",
      features: ["Personalized service", "Custom itineraries", "Local attraction tours", "Flexible scheduling"]
    },
    {
      name: "Convention Hotels",
      description: "Large-scale event and conference venues",
      features: ["Group coordination", "Event logistics", "Multiple vehicle dispatch", "Conference center access"]
    }
  ];

  const benefits = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Reliable Partnership",
      description: "Trusted transportation partner with proven track record of excellence and reliability for hotel operations."
    },
    {
      icon: <Crown className="w-6 h-6" />,
      title: "Enhanced Guest Experience",
      description: "Elevate your hotel's service offering with premium luxury transportation that matches your hospitality standards."
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Seamless Integration",
      description: "Easy booking integration with your hotel systems and processes, including concierge desk coordination."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Dedicated Account Management",
      description: "Assigned account managers to ensure consistent service quality and handle all transportation logistics."
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
                  <Building2 className="w-16 h-16 text-white" />
                </div>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold mb-6" data-testid="hotels-page-title">
                <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                  Hotel Partnerships
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8" data-testid="hotels-page-description">
                Premium transportation services for hotels and their distinguished guests throughout Houston
              </p>

              {/* Stats Bar */}
              <div className="flex flex-wrap justify-center gap-8 mt-12">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">50+</div>
                  <div className="text-sm text-slate-400 mt-1">Hotel Partners</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">24/7</div>
                  <div className="text-sm text-slate-400 mt-1">Concierge Support</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">VIP</div>
                  <div className="text-sm text-slate-400 mt-1">Guest Service</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hotel Services - Enhanced Design */}
        <section className="py-20 bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full mb-4">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent" data-testid="services-title">
                Hotel Transportation Services
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Comprehensive luxury transportation solutions designed specifically for hotels and their guests
              </p>
            </div>

            {/* Service Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {hotelServices.map((service, index) => (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Top Accent */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  
                  <CardHeader className="text-center p-8">
                    {/* Icon Container */}
                    <div className="flex justify-center mb-6">
                      <div className="relative p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          {service.icon}
                        </div>
                      </div>
                    </div>
                    
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-300 mb-3" data-testid={`service-${index}-title`}>
                      {service.title}
                    </CardTitle>
                    
                    <CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed" data-testid={`service-${index}-description`}>
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Hotel Partnership Programs - Modern Cards */}
        <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-full mb-4">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-amber-600 to-slate-900 dark:from-white dark:via-amber-400 dark:to-white bg-clip-text text-transparent" data-testid="partnerships-title">
                Hotel Partnership Programs
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Tailored partnership programs designed for different types of hospitality establishments
              </p>
            </div>

            {/* Partnership Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {hotelPartners.map((partner, index) => (
                <Card 
                  key={index} 
                  className="group overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2"
                >
                  {/* Header */}
                  <CardHeader className="relative bg-gradient-to-br from-amber-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-8 border-b border-slate-100 dark:border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300 mb-2" data-testid={`partner-${index}-name`}>
                        {partner.name}
                      </CardTitle>
                      <CardDescription className="font-semibold text-amber-600 dark:text-amber-400" data-testid={`partner-${index}-description`}>
                        {partner.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  
                  {/* Features List */}
                  <CardContent className="p-8">
                    <div className="space-y-3">
                      {partner.features.map((feature, featureIndex) => (
                        <div 
                          key={featureIndex}
                          className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-200"
                          data-testid={`partner-${index}-feature-${featureIndex}`}
                        >
                          <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded-full flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-amber-500" />
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Partnership Benefits */}
        <section className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full mb-4">
                <Crown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-blue-600 to-slate-900 dark:from-white dark:via-blue-400 dark:to-white bg-clip-text text-transparent" data-testid="benefits-title">
                Partnership Benefits
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Why hotels choose USA Luxury Limo as their preferred transportation partner
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card 
                  key={index} 
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-2"
                >
                  <CardHeader className="p-8">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        {benefit.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mb-3" data-testid={`benefit-${index}-title`}>
                          {benefit.title}
                        </CardTitle>
                        <CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed" data-testid={`benefit-${index}-description`}>
                          {benefit.description}
                        </CardDescription>
                      </div>
                    </div>
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
              <Building2 className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold mb-6" data-testid="contact-title">
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                Partner With Us Today
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed" data-testid="contact-description">
              Join our network of prestigious hotel partners and provide your guests with exceptional luxury transportation services
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto mb-16">
              <Button 
                onClick={() => setLocation('/booking')}
                className="group bg-white text-slate-900 px-10 py-6 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all duration-300 shadow-2xl hover:shadow-white/20 hover:-translate-y-1"
                data-testid="partnership-inquiry-button"
              >
                <Calendar className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                Partnership Inquiry
              </Button>
              
              <a 
                href="mailto:usaluxurylimo@gmail.com"
                className="group border-2 border-white/30 text-white px-10 py-6 rounded-xl font-bold text-lg hover:bg-white hover:text-slate-900 transition-all duration-300 inline-flex items-center justify-center backdrop-blur-sm hover:border-white hover:shadow-2xl hover:-translate-y-1"
                data-testid="contact-email-button"
              >
                <Mail className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                Contact Us
              </a>
            </div>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-4">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
                <p className="text-slate-300">Round-the-clock assistance for all your hotel transportation needs</p>
              </div>
              
              <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Houston Coverage</h3>
                <p className="text-slate-300">Comprehensive service throughout Greater Houston and surrounding areas</p>
              </div>
              
              <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-4">
                  <Star className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Premium Fleet</h3>
                <p className="text-slate-300">Luxury vehicles and professional chauffeurs for discerning guests</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
