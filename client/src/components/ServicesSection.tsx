import { Plane, Briefcase, Heart, Clock } from "lucide-react";
import { useLocation } from "wouter";

const airportTransferBg = '/images/67dc52e7ef277_1759125789879.webp';
const corporateTravelBg = '/images/corporate_1759126654203.webp';
const specialEventsBg = '/images/event_1759126933449.webp';
const hourlyServiceBg = '/images/hourly_1759159676580.png';

export default function ServicesSection() {
  const [, setLocation] = useLocation();
  
  const services = [
    {
      id: "airport-transfer",
      icon: Plane,
      title: "Airport Transfer",
      description: "Reliable airport pickup and drop-off with flight tracking and meet & greet service.",
      features: ["Flight tracking", "Meet & greet", "Free waiting time"]
    },
    {
      id: "corporate-travel",
      icon: Briefcase,
      title: "Corporate Travel",
      description: "Professional transportation for business meetings, events, and executive travel.",
      features: ["Business-class vehicles", "Professional chauffeurs", "Corporate billing"]
    },
    {
      id: "special-events",
      icon: Heart,
      title: "Special Events",
      description: "Make your special occasions memorable with our luxury transportation services.",
      features: ["Wedding packages", "Prom & graduation", "Anniversary celebrations"]
    },
    {
      id: "hourly-service",
      icon: Clock,
      title: "Hourly Service",
      description: "Flexible hourly transportation for multiple stops, shopping trips, and extended travel needs.",
      features: ["Flexible scheduling", "Multiple destinations", "Wait time included", "Customizable routes"]
    }
  ];

  return (
    <section id="services" className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4" data-testid="services-title">
            Our Premium Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="services-description">
            From airport transfers to special events, we provide luxury transportation solutions tailored to your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div 
              key={service.id}
              className="bg-cover bg-center bg-no-repeat relative rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border overflow-hidden cursor-pointer"
              style={
                index === 0 ? { backgroundImage: `url(${airportTransferBg})` } :
                index === 1 ? { backgroundImage: `url(${corporateTravelBg})` } :
                index === 2 ? { backgroundImage: `url(${specialEventsBg})` } :
                index === 3 ? { backgroundImage: `url(${hourlyServiceBg})` } : {}
              }
              onClick={() => setLocation(`/service/${service.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setLocation(`/service/${service.id}`);
                }
              }}
              role="button"
              tabIndex={0}
              data-testid={`service-card-${service.id}`}
            >
              <div className="absolute inset-0 bg-black/50 rounded-xl"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-6">
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white" data-testid={`service-title-${index}`}>
                  {service.title}
                </h3>
                <p className="mb-4 text-white/90" data-testid={`service-description-${index}`}>
                  {service.description}
                </p>
                <ul className="space-y-2 text-sm text-white/80">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center" data-testid={`service-feature-${index}-${featureIndex}`}>
                      <span className="mr-2 text-white">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
