import { Plane, Briefcase, Heart, Clock, Car, Users, Star, Shield, Calendar, MapPin, type LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServiceSelect } from "@shared/schema";

// Icon registry for mapping database icon strings to React components
const iconMap: Record<string, LucideIcon> = {
  Plane,
  Briefcase,
  Heart,
  Clock,
  Car,
  Users,
  Star,
  Shield,
  Calendar,
  MapPin,
};

// Default gradient background for services without images
const defaultGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

export default function ServicesSection() {
  const [, setLocation] = useLocation();
  
  // Fetch services from API
  const { data: services, isLoading, isError, refetch } = useQuery<ServiceSelect[]>({
    queryKey: ["/api/services"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <Skeleton className="h-80 w-full" data-testid={`service-skeleton-${i}`} />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <p className="text-destructive font-medium mb-4" data-testid="services-error">
                Unable to load services. Please try again.
              </p>
              <Button 
                onClick={() => refetch()} 
                variant="outline"
                data-testid="button-retry-services"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Success State */}
        {!isLoading && !isError && services && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.filter(s => s.slug).map((service, index) => {
              // Get icon component from registry, fallback to Star
              const IconComponent = iconMap[service.icon] || Star;
              
              // Use service image URL or fallback to gradient
              const backgroundImage = service.imageUrl 
                ? `url(${service.imageUrl})` 
                : defaultGradient;

              return (
                <div 
                  key={service.id}
                  className="bg-cover bg-center bg-no-repeat relative rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border overflow-hidden cursor-pointer"
                  style={{ backgroundImage }}
                  onClick={() => setLocation(`/service/${service.slug}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLocation(`/service/${service.slug}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  data-testid={`service-card-${service.slug}`}
                >
                  <div className="absolute inset-0 bg-black/50 rounded-xl"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-6">
                      <IconComponent className="w-8 h-8 text-white" />
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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
