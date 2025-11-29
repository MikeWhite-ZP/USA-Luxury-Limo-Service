import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Shield, 
  UserCheck, 
  Car, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Heart, 
  Lock,
  ArrowLeft,
  Star,
  Award,
  Users
} from "lucide-react";

export default function Safety() {
  const [, setLocation] = useLocation();

  const safetyFeatures = [
    {
      icon: <UserCheck className="w-8 h-8" />,
      title: "Professional Chauffeurs",
      description: "All chauffeurs undergo comprehensive background checks, drug testing, and professional training",
      details: [
        "DOT-certified professional drivers",
        "Extensive background checks and fingerprinting",
        "Regular drug and alcohol testing",
        "Defensive driving certification",
        "Customer service training",
        "Ongoing performance monitoring"
      ]
    },
    {
      icon: <Car className="w-8 h-8" />,
      title: "Vehicle Safety Standards",
      description: "Our fleet meets and exceeds all safety regulations with regular maintenance and inspections",
      details: [
        "Regular DOT safety inspections",
        "Preventive maintenance programs",
        "Commercial-grade insurance coverage",
        "Advanced safety equipment installed",
        "Real-time GPS tracking",
        "Emergency communication systems"
      ]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Insurance & Protection",
      description: "Comprehensive commercial insurance coverage for complete peace of mind",
      details: [
        "$2 million liability coverage",
        "Comprehensive collision coverage",
        "Passenger protection insurance",
        "Professional liability coverage",
        "Garage keeper's liability",
        "Workers' compensation"
      ]
    },
    {
      icon: <Phone className="w-8 h-8" />,
      title: "24/7 Support & Monitoring",
      description: "Round-the-clock dispatch monitoring and emergency support services",
      details: [
        "24/7 dispatch center monitoring",
        "Real-time vehicle tracking",
        "Emergency response protocols",
        "Direct communication with chauffeurs",
        "Customer support hotline",
        "Incident reporting system"
      ]
    }
  ];

  const safetyProtocols = [
    {
      category: "Pre-Service Safety",
      icon: <CheckCircle2 className="w-6 h-6" />,
      protocols: [
        "Vehicle safety inspection before each trip",
        "Chauffeur fitness-for-duty assessment",
        "Route planning and hazard identification",
        "Weather and traffic condition monitoring",
        "Emergency equipment check",
        "Communication system verification"
      ]
    },
    {
      category: "During Service",
      icon: <Clock className="w-6 h-6" />,
      protocols: [
        "Continuous GPS monitoring",
        "Adherence to speed limits and traffic laws",
        "Regular check-ins with dispatch",
        "Passenger safety and comfort monitoring",
        "Emergency response readiness",
        "Professional conduct standards"
      ]
    },
    {
      category: "Emergency Procedures",
      icon: <AlertTriangle className="w-6 h-6" />,
      protocols: [
        "Immediate emergency services contact",
        "Passenger evacuation procedures",
        "Medical emergency response",
        "Vehicle breakdown protocols",
        "Incident documentation",
        "Family notification procedures"
      ]
    }
  ];

  const certifications = [
    {
      title: "DOT Certification",
      description: "Department of Transportation certified operation",
      icon: <Award className="w-6 h-6" />
    },
    {
      title: "GCLA Member",
      description: "Greater Houston Limousine Association member",
      icon: <Star className="w-6 h-6" />
    },
    {
      title: "BBB Accredited",
      description: "Better Business Bureau accredited business",
      icon: <CheckCircle2 className="w-6 h-6" />
    },
    {
      title: "Commercial License",
      description: "Fully licensed commercial transportation provider",
      icon: <Shield className="w-6 h-6" />
    }
  ];

  const covidSafety = [
    "Enhanced vehicle sanitization between rides",
    "HEPA air filtration systems",
    "Hand sanitizer available in all vehicles",
    "Contactless payment options",
    "Health screening protocols for chauffeurs",
    "Flexible cancellation policies for health concerns"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/')}
                className="text-white hover:text-white hover:bg-white/20 mb-6"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              
              <div className="flex items-center justify-center mb-6">
                <Shield className="w-16 h-16 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="safety-page-title">
                Safety First
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto" data-testid="safety-page-description">
                Your safety and security are our highest priorities. Learn about our comprehensive safety measures, professional standards, and commitment to excellence.
              </p>
            </div>
          </div>
        </section>

        {/* Safety Commitment */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" data-testid="safety-commitment-title">
                Our Safety Commitment
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                USA Luxury Limo maintains the highest safety standards in the industry. Every aspect of our operation is designed with your safety and peace of mind in mind.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {safetyFeatures.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full text-primary">
                        {feature.icon}
                      </div>
                    </div>
                    <CardTitle className="text-lg" data-testid={`safety-feature-${index}-title`}>
                      {feature.title}
                    </CardTitle>
                    <CardDescription data-testid={`safety-feature-${index}-description`}>
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-left space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start space-x-2" data-testid={`safety-feature-${index}-detail-${detailIndex}`}>
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Safety Protocols */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" data-testid="safety-protocols-title">
                Safety Protocols & Procedures
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Our comprehensive safety protocols ensure consistent, reliable, and secure transportation services at every stage of your journey.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {safetyProtocols.map((protocol, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-primary/5">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-primary">
                        {protocol.icon}
                      </div>
                      <CardTitle className="text-xl" data-testid={`protocol-${index}-title`}>
                        {protocol.category}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {protocol.protocols.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start space-x-3" data-testid={`protocol-${index}-item-${itemIndex}`}>
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications & Compliance */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" data-testid="certifications-title">
                Certifications & Compliance
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                We maintain all required certifications and exceed industry standards for safety and professional operation.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {certifications.map((cert, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600">
                        {cert.icon}
                      </div>
                    </div>
                    <CardTitle className="text-lg" data-testid={`certification-${index}-title`}>
                      {cert.title}
                    </CardTitle>
                    <CardDescription data-testid={`certification-${index}-description`}>
                      {cert.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Health & Safety Measures */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4" data-testid="health-safety-title">
                  Health & Wellness Measures
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Enhanced health and safety protocols to protect our passengers and chauffeurs.
                </p>
              </div>

              <Card className="overflow-hidden">
                <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-6 h-6 text-blue-600" />
                    <CardTitle className="text-xl" data-testid="covid-safety-title">
                      Enhanced Health Protocols
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {covidSafety.map((measure, index) => (
                      <div key={index} className="flex items-start space-x-3" data-testid={`covid-measure-${index}`}>
                        <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{measure}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4" data-testid="emergency-contact-title">
              Emergency Support
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto" data-testid="emergency-contact-description">
              Our 24/7 emergency support team is always ready to assist you with any safety concerns or emergencies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+18324796515"
                className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
                data-testid="emergency-call-button"
              >
                <Phone className="w-5 h-5 mr-2" />
                Emergency: (832) 479-6515
              </a>
              <a 
                href="mailto:usaluxurylimo@gmail.com"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors inline-flex items-center justify-center"
                data-testid="emergency-email-button"
              >
                <Lock className="w-5 h-5 mr-2" />
                Report Safety Concern
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}