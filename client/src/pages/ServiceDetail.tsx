import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plane, Briefcase, Heart, Clock, Star, Check, Phone, Car, Users, Shield, Calendar, MapPin, type LucideIcon } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { ServiceSelect } from "@shared/schema";

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

const defaultGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

export default function ServiceDetail() {
  const [, params] = useRoute("/service/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug;

  const { data: service, isLoading, isError } = useQuery<ServiceSelect>({
    queryKey: ["/api/services", slug],
    queryFn: async () => {
      const response = await fetch(`/api/services/${slug}`);
      if (!response.ok) {
        throw new Error("Service not found");
      }
      return response.json();
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <Skeleton className="h-64 w-full" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-8 w-48" />
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              </div>
              <div>
                <Skeleton className="h-96 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Service Not Found</h1>
            <p className="text-muted-foreground mb-6">The service you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const IconComponent = iconMap[service.icon] || Star;
  const backgroundImage = service.imageUrl 
    ? `url(${service.imageUrl})` 
    : defaultGradient;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div 
          className="relative h-64 bg-cover bg-center"
          style={{ backgroundImage }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="text-white">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/#services')}
                className="text-white hover:text-white hover:bg-white/20 mb-4"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Services
              </Button>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold" data-testid="service-title">
                    {service.title}
                  </h1>
                  <p className="text-xl text-white/90" data-testid="service-description">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Service Overview
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed" data-testid="detailed-description">
                  {service.description}
                </p>
              </div>

              {service.features && service.features.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">
                    What's Included
                  </h2>
                  <div className="grid gap-3">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-primary mt-0.5" />
                        <span className="text-muted-foreground" data-testid={`benefit-${index}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center">
                    <Star className="w-6 h-6 mr-2 text-primary" />
                    Book This Service
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    <p className="text-muted-foreground">
                      Ready to experience luxury transportation? Book our {service.title.toLowerCase()} service today.
                    </p>
                    
                    {service.features && service.features.length > 0 && (
                      <div className="border-t border-border pt-4">
                        <h4 className="font-semibold text-foreground mb-3">Key Features:</h4>
                        <div className="space-y-2">
                          {service.features.slice(0, 4).map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Check className="w-4 h-4 text-primary" />
                              <span className="text-sm text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button 
                      className="w-full text-lg py-6"
                      onClick={() => setLocation(`/booking?service=${service.slug}`)}
                      data-testid="button-book-service"
                    >
                      Book Now
                    </Button>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Need help or have questions?
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation('/#contact')}
                        data-testid="button-contact"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Contact Us
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-4">Available 24/7</h4>
                  <p className="text-sm text-muted-foreground">
                    Our luxury transportation services are available around the clock. 
                    Book online or call us for immediate assistance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
