import { Clock, Shield, CreditCard, Heart } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Round-the-clock service for all your transportation needs, whenever you need us."
    },
    {
      icon: Shield,
      title: "Professional Drivers",
      description: "Experienced, licensed, and background-checked chauffeurs committed to your safety."
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Safe and secure payment processing with industry-leading encryption technology."
    },
    {
      icon: Heart,
      title: "Premium Amenities",
      description: "Complimentary WiFi, refreshments, and luxury amenities in every vehicle."
    }
  ];

  return (
    <section className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4" data-testid="features-title">
            Why Choose USA Luxury Limo?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="features-description">
            Experience the difference with our commitment to excellence, reliability, and luxury in every journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center" data-testid={`feature-${index}`}>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`feature-title-${index}`}>
                {feature.title}
              </h3>
              <p className="text-muted-foreground" data-testid={`feature-description-${index}`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
