import { Plane, Briefcase, Heart } from "lucide-react";

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
              className="bg-card rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border"
              data-testid={`service-card-${index}`}
            >
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <service.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3" data-testid={`service-title-${index}`}>
                {service.title}
              </h3>
              <p className="text-muted-foreground mb-4" data-testid={`service-description-${index}`}>
                {service.description}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center" data-testid={`service-feature-${index}-${featureIndex}`}>
                    <span className="text-primary mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
