import { Star, Users, Clock, Shield, Award, CheckCircle } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6" data-testid="about-title">
            About USA Luxury Limo Service
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed" data-testid="about-subtitle">
            Your trusted partner for premier luxury chauffeur services. We deliver a seamless blend of elegance, comfort, and reliability, making every journey a memorable experience tailored to your unique needs.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Content */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" data-testid="about-welcome-title">
                Welcome to Excellence
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6" data-testid="about-welcome-description">
                Whether you're traveling for business, attending a wedding, or exploring the city, we ensure a first-class experience from start to finish. Our focus on exceptional hospitality and unwavering professionalism sets us apart as a leader in luxury transportation.
              </p>
              <p className="text-gray-600 leading-relaxed" data-testid="about-mission">
                At USA Luxury Limo Service, we don't just transport you; we elevate your travel experience. Discover the perfect blend of luxury and trust with a service that values your time, comfort, and satisfaction.
              </p>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-experience">6+</div>
                <div className="text-gray-600 text-sm font-medium">Years Experience</div>
              </div>
              <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-availability">24/7</div>
                <div className="text-gray-600 text-sm font-medium">Service Available</div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6" data-testid="why-choose-title">
              Why Choose USA Luxury Limo Service?
            </h3>
            
            <div className="space-y-6">
              {/* Impeccable Fleet */}
              <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-sm border" data-testid="feature-fleet">
                <div className="flex-shrink-0">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Impeccable Fleet</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Our selection of luxury vehicles is carefully curated and maintained to the highest standards. From sleek executive sedans and spacious SUVs to sophisticated limousines and executive vans, we offer options that cater to every occasion.
                  </p>
                </div>
              </div>

              {/* Expert Chauffeurs */}
              <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-sm border" data-testid="feature-chauffeurs">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Expert Chauffeurs</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Every chauffeur in our team is rigorously trained, highly experienced, and deeply committed to your comfort and safety. Their extensive knowledge of local routes and attractions ensures efficient and stress-free travel.
                  </p>
                </div>
              </div>

              {/* Commitment to Excellence */}
              <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-sm border" data-testid="feature-excellence">
                <div className="flex-shrink-0">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Commitment to Excellence</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    We go above and beyond to exceed your expectations. Our services are designed to provide peace of mind, luxury, and convenience, with a personal touch that reflects our passion for hospitality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Highlights */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4" data-testid="service-highlights-title">
              What Sets Us Apart
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto" data-testid="service-highlights-subtitle">
              Our commitment to excellence is reflected in every aspect of our service
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Professional Service */}
            <div className="text-center group" data-testid="highlight-professional">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Professional Service</h4>
              <p className="text-gray-600 text-sm">Licensed, trained, and experienced chauffeurs committed to your safety and comfort.</p>
            </div>

            {/* 24/7 Availability */}
            <div className="text-center group" data-testid="highlight-availability">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">24/7 Availability</h4>
              <p className="text-gray-600 text-sm">Round-the-clock service for all your transportation needs, whenever you need us.</p>
            </div>

            {/* Luxury Fleet */}
            <div className="text-center group" data-testid="highlight-luxury">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Luxury Fleet</h4>
              <p className="text-gray-600 text-sm">Premium vehicles equipped with modern amenities for the ultimate travel experience.</p>
            </div>

            {/* Reliable Service */}
            <div className="text-center group" data-testid="highlight-reliable">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Reliable Service</h4>
              <p className="text-gray-600 text-sm">Punctual, dependable transportation you can count on for every occasion.</p>
            </div>
          </div>
        </div>

        {/* Professional Memberships */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4" data-testid="memberships-text">
            Proud member of the <strong>Limousine Worldwide Directory</strong> and the <strong>Limousine Association International</strong>
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <span className="flex items-center" data-testid="membership-worldwide">
              <Award className="w-4 h-4 mr-2 text-primary" />
              Limousine Worldwide Directory
            </span>
            <span className="flex items-center" data-testid="membership-international">
              <Award className="w-4 h-4 mr-2 text-primary" />
              Limousine Association International
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}