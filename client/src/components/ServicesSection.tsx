import { Plane, Briefcase, Heart } from "lucide-react";
import airportTransferBg from "@assets/67dc52e7ef277_1759125789879.webp";

export default function ServicesSection() {
  const services = [
    {
      icon: Plane,
      title: "Airport Transfer",
      description: "Reliable airport pickup and drop-off with flight tracking and meet & greet service.",
      features: ["Flight tracking", "Meet & greet", "Free waiting time"]
    },
    {
      icon: Briefcase,
      title: "Corporate Travel",
      description: "Professional transportation for business meetings, events, and executive travel.",
      features: ["Business-class vehicles", "Professional chauffeurs", "Corporate billing"]
    },
    {
      icon: Heart,
      title: "Special Events",
      description: "Make your special occasions memorable with our luxury transportation services.",
      features: ["Wedding packages", "Prom & graduation", "Anniversary celebrations"]
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className={`${
                index === 0 
                  ? 'bg-cover bg-center bg-no-repeat relative rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border overflow-hidden' 
                  : 'bg-card rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border'
              }`}
              style={index === 0 ? { backgroundImage: `url(${airportTransferBg})` } : {}}
              data-testid={`service-card-${index}`}
            >
              {index === 0 && (
                <div className="absolute inset-0 bg-black/50 rounded-xl"></div>
              )}
              <div className={`relative z-10 ${index === 0 ? '' : ''}`}>
                <div className={`w-16 h-16 ${index === 0 ? 'bg-white/20 backdrop-blur-sm' : 'bg-primary/10'} rounded-lg flex items-center justify-center mb-6`}>
                  <service.icon className={`w-8 h-8 ${index === 0 ? 'text-white' : 'text-primary'}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${index === 0 ? 'text-white' : 'text-card-foreground'}`} data-testid={`service-title-${index}`}>
                  {service.title}
                </h3>
                <p className={`mb-4 ${index === 0 ? 'text-white/90' : 'text-muted-foreground'}`} data-testid={`service-description-${index}`}>
                  {service.description}
                </p>
                <ul className={`space-y-2 text-sm ${index === 0 ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center" data-testid={`service-feature-${index}-${featureIndex}`}>
                      <span className={`mr-2 ${index === 0 ? 'text-white' : 'text-primary'}`}>✓</span>
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
