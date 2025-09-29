import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ServicesSection from "@/components/ServicesSection";
import FleetSection from "@/components/FleetSection";
import FeaturesSection from "@/components/FeaturesSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import AuthModals from "@/components/AuthModals";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <FleetSection />
        <FeaturesSection />
        <ContactSection />
      </main>
      <Footer />
      <AuthModals />
    </div>
  );
}
