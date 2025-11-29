import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Star, 
  Users, 
  Award, 
  Shield, 
  Clock, 
  CheckCircle,
  Target,
  Heart,
  Sparkles,
  TrendingUp,
  Phone,
  Mail
} from "lucide-react";

export default function AboutUs() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section - Modern with Overlay */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-primary/10 to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/')}
                className="text-white/80 hover:text-white hover:bg-white/10 mb-8 border border-white/20"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Luxury Transportation Excellence Since 2018</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80" data-testid="about-page-title">
                About USA Luxury Limo
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed" data-testid="about-page-description">
                Your trusted partner for premier luxury chauffeur services. We deliver a seamless blend of elegance, comfort, and reliability, making every journey a memorable experience tailored to your unique needs.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section - Modern Cards */}
        <section className="py-16 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all hover:-translate-y-1" data-testid="stat-experience">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">6+</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Years Experience</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all hover:-translate-y-1" data-testid="stat-availability">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">24/7</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Service Available</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">500+</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Happy Clients</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">100%</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision - Side by Side */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="about-welcome-title">
                  Welcome to Excellence
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="about-welcome-description">
                  Whether you're traveling for business, attending a wedding, or exploring the city, we ensure a first-class experience from start to finish.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Mission Card */}
                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="about-mission">
                    At USA Luxury Limo Service, we don't just transport you; we elevate your travel experience. Our mission is to deliver unparalleled luxury transportation services that exceed expectations, combining professional excellence with personalized care to ensure every journey is memorable and stress-free.
                  </p>
                </div>

                {/* Vision Card */}
                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To be the premier choice for luxury ground transportation, recognized for our commitment to safety, professionalism, and customer satisfaction. We strive to set new standards in the industry through continuous innovation, exceptional service quality, and unwavering dedication to our clients' needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - Feature Grid */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="why-choose-title">
                  Why Choose USA Luxury Limo Service?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Experience the difference that true luxury and professionalism can make
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Impeccable Fleet */}
                <div className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:border-primary/50 transition-all" data-testid="feature-fleet">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Impeccable Fleet</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Our selection of luxury vehicles is carefully curated and maintained to the highest standards. From sleek executive sedans and spacious SUVs to sophisticated limousines and executive vans, we offer options that cater to every occasion.
                  </p>
                </div>

                {/* Expert Chauffeurs */}
                <div className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:border-primary/50 transition-all" data-testid="feature-chauffeurs">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Expert Chauffeurs</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Every chauffeur in our team is rigorously trained, highly experienced, and deeply committed to your comfort and safety. Their extensive knowledge of local routes and attractions ensures efficient and stress-free travel.
                  </p>
                </div>

                {/* Commitment to Excellence */}
                <div className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:border-primary/50 transition-all" data-testid="feature-excellence">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-6 group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Commitment to Excellence</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We go above and beyond to exceed your expectations. Our services are designed to provide peace of mind, luxury, and convenience, with a personal touch that reflects our passion for hospitality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service Highlights - Modern Icons Grid */}
        <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="service-highlights-title">
                  What Sets Us Apart
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="service-highlights-subtitle">
                  Our commitment to excellence is reflected in every aspect of our service
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Professional Service */}
                <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary/50 transition-all" data-testid="highlight-professional">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Professional Service</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Licensed, trained, and experienced chauffeurs committed to your safety and comfort.
                  </p>
                </div>

                {/* 24/7 Availability */}
                <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary/50 transition-all" data-testid="highlight-availability">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">24/7 Availability</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Round-the-clock service for all your transportation needs, whenever you need us.
                  </p>
                </div>

                {/* Luxury Fleet */}
                <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary/50 transition-all" data-testid="highlight-luxury">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Luxury Fleet</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Premium vehicles equipped with modern amenities for the ultimate travel experience.
                  </p>
                </div>

                {/* Reliable Service */}
                <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary/50 transition-all" data-testid="highlight-reliable">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Reliable Service</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Punctual, dependable transportation you can count on for every occasion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  The principles that guide everything we do
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-2xl p-8 border border-primary/20">
                  <Heart className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-3">Customer First</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your satisfaction is our top priority. We listen, adapt, and deliver services that exceed your expectations every single time.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-2xl p-8 border border-primary/20">
                  <Shield className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-3">Safety & Security</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Your safety is non-negotiable. Our vehicles are meticulously maintained and our drivers are thoroughly vetted and trained.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-2xl p-8 border border-primary/20">
                  <Sparkles className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-3">Excellence in Service</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We are committed to maintaining the highest standards of service quality, professionalism, and attention to detail.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Memberships - Enhanced */}
        <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-primary">Industry Recognition</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4" data-testid="memberships-text">
                    Professional Memberships
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    Proud member of leading industry organizations
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20" data-testid="membership-worldwide">
                      <Award className="w-6 h-6 text-primary flex-shrink-0" />
                      <span className="font-medium">Limousine Worldwide Directory</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20" data-testid="membership-international">
                      <Award className="w-6 h-6 text-primary flex-shrink-0" />
                      <span className="font-medium">Limousine Association International</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Experience Luxury?
              </h2>
              <p className="text-xl text-white/80 mb-8">
                Book your premium transportation today and discover the USA Luxury Limo difference
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={() => setLocation('/booking')}
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/50"
                  data-testid="button-book-now"
                >
                  Book Now
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation('/contact')}
                  className="border-white/20 text-white hover:bg-white/10"
                  data-testid="button-contact"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
