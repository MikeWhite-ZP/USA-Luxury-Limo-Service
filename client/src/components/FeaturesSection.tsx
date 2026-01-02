import { Clock, Shield, CreditCard, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBranding } from "@/hooks/useBranding";

export default function FeaturesSection() {
  const { t } = useTranslation();
  const { companyName } = useBranding();
  const features = [
    {
      icon: Clock,
      titleKey: "features.availability.title",
      descriptionKey: "features.availability.description"
    },
    {
      icon: Shield,
      titleKey: "features.drivers.title",
      descriptionKey: "features.drivers.description"
    },
    {
      icon: CreditCard,
      titleKey: "features.payments.title",
      descriptionKey: "features.payments.description"
    },
    {
      icon: Heart,
      titleKey: "features.amenities.title",
      descriptionKey: "features.amenities.description"
    }
  ];

  return (
    <section className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4" data-testid="features-title">
            {t('features.title', { companyName })}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="features-description">
            {t('features.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center" data-testid={`feature-${index}`}>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`feature-title-${index}`}>
                {t(feature.titleKey)}
              </h3>
              <p className="text-muted-foreground" data-testid={`feature-description-${index}`}>
                {t(feature.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
