import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-white">
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
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="privacy-title">
                Privacy Policy
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Your privacy is important to us. This policy explains how we collect, use, and protect your information.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="prose prose-lg max-w-none">
            
            {/* Table of Contents */}
            <div className="bg-muted/30 p-6 rounded-lg mb-12">
              <h2 className="text-xl font-semibold text-foreground mb-4">Table of Contents</h2>
              <ol className="space-y-2 text-muted-foreground">
                <li><a href="#section-1" className="hover:text-primary transition-colors" data-testid="toc-link-1">1. Information We Collect</a></li>
                <li><a href="#section-2" className="hover:text-primary transition-colors" data-testid="toc-link-2">2. How We Use Your Information</a></li>
                <li><a href="#section-3" className="hover:text-primary transition-colors" data-testid="toc-link-3">3. Information Sharing and Disclosure</a></li>
                <li><a href="#section-4" className="hover:text-primary transition-colors" data-testid="toc-link-4">4. Data Security</a></li>
                <li><a href="#section-5" className="hover:text-primary transition-colors" data-testid="toc-link-5">5. Cookies and Tracking Technologies</a></li>
                <li><a href="#section-6" className="hover:text-primary transition-colors" data-testid="toc-link-6">6. Your Rights and Choices</a></li>
                <li><a href="#section-7" className="hover:text-primary transition-colors" data-testid="toc-link-7">7. Children's Privacy</a></li>
                <li><a href="#section-8" className="hover:text-primary transition-colors" data-testid="toc-link-8">8. International Data Transfers</a></li>
                <li><a href="#section-9" className="hover:text-primary transition-colors" data-testid="toc-link-9">9. Changes to This Privacy Policy</a></li>
                <li><a href="#section-10" className="hover:text-primary transition-colors" data-testid="toc-link-10">10. Contact Us</a></li>
              </ol>
            </div>

            {/* Introduction */}
            <section className="mb-12">
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>Last Updated:</strong> September 2025
                </p>
                <p>
                  USA Luxury Limo Service ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our transportation services, visit our website, or use our mobile application (collectively, the "Services").
                </p>
                <p>
                  Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access or use our Services.
                </p>
              </div>
            </section>

            {/* Section 1 */}
            <section id="section-1" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">1. INFORMATION WE COLLECT</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">1.1 Personal Information</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>We collect personal information that you provide directly to us, including:</p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li><strong>Contact Information:</strong> Name, email address, phone number, and mailing address</li>
                    <li><strong>Account Information:</strong> Username, password, and profile information</li>
                    <li><strong>Payment Information:</strong> Credit card details, billing address, and payment history</li>
                    <li><strong>Trip Information:</strong> Pickup and drop-off locations, trip preferences, special requests</li>
                    <li><strong>Identification:</strong> Driver's license or other government-issued ID when required</li>
                  </ul>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">1.2 Automatically Collected Information</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>When you use our Services, we automatically collect certain information, including:</p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li><strong>Location Data:</strong> GPS coordinates, IP address-based location</li>
                    <li><strong>Device Information:</strong> Device type, operating system, browser type, unique device identifiers</li>
                    <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on our platform</li>
                    <li><strong>Log Data:</strong> Server logs, error reports, performance data</li>
                  </ul>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">1.3 Third-Party Information</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>We may receive information from third parties, such as:</p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li>Social media platforms when you connect your accounts</li>
                    <li>Background check providers for driver verification</li>
                    <li>Payment processors for transaction processing</li>
                    <li>Marketing partners and analytics providers</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">2. HOW WE USE YOUR INFORMATION</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We use the information we collect for various purposes, including:</p>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>Service Provision:</strong> To provide, maintain, and improve our transportation services</li>
                  <li><strong>Trip Management:</strong> To match you with drivers, process bookings, and facilitate rides</li>
                  <li><strong>Payment Processing:</strong> To process payments and manage billing</li>
                  <li><strong>Communication:</strong> To send confirmations, updates, and customer support responses</li>
                  <li><strong>Safety and Security:</strong> To verify identities, investigate incidents, and ensure platform safety</li>
                  <li><strong>Personalization:</strong> To customize your experience and provide relevant recommendations</li>
                  <li><strong>Marketing:</strong> To send promotional materials and offers (with your consent)</li>
                  <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                  <li><strong>Analytics:</strong> To analyze usage patterns and improve our Services</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">3. INFORMATION SHARING AND DISCLOSURE</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">3.1 Service Providers</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>We share information with third-party service providers who help us operate our business, including:</p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li>Payment processors (Stripe) for transaction processing</li>
                    <li>Mapping services (TomTom) for navigation and location services</li>
                    <li>Cloud hosting providers for data storage and processing</li>
                    <li>Customer support platforms for service delivery</li>
                    <li>Analytics providers for performance measurement</li>
                  </ul>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">3.2 Legal Requirements</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>We may disclose your information when required by law or to:</p>
                  <ul className="list-disc ml-6 space-y-2">
                    <li>Comply with legal processes, court orders, or government requests</li>
                    <li>Protect our rights, property, or safety, or that of our users</li>
                    <li>Investigate potential violations of our Terms of Service</li>
                    <li>Respond to claims of illegal activity or infringement</li>
                  </ul>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">3.3 Business Transfers</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    In connection with any merger, sale, or transfer of our business, your information may be transferred to the acquiring entity, subject to the same privacy protections.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">4. DATA SECURITY</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>Encryption:</strong> Data encryption in transit and at rest</li>
                  <li><strong>Access Controls:</strong> Restricted access to personal information on a need-to-know basis</li>
                  <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                  <li><strong>Secure Infrastructure:</strong> Industry-standard security protocols and practices</li>
                  <li><strong>Employee Training:</strong> Regular privacy and security training for our staff</li>
                </ul>
                <p>
                  However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">5. COOKIES AND TRACKING TECHNOLOGIES</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We use cookies, web beacons, and similar tracking technologies to enhance your experience and collect information about how you use our Services.
                </p>
                
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-foreground mb-3">Types of Cookies We Use:</h4>
                  <ul className="list-disc ml-6 space-y-2">
                    <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
                    <li><strong>Performance Cookies:</strong> Help us understand how visitors use our website</li>
                    <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                    <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
                  </ul>
                </div>
                
                <p>
                  You can control cookies through your browser settings. However, disabling certain cookies may affect the functionality of our Services.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">6. YOUR RIGHTS AND CHOICES</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Depending on your location, you may have the following rights regarding your personal information:</p>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Restriction:</strong> Request limitation of processing activities</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                </ul>
                <p>
                  To exercise these rights, please contact us using the information provided in Section 10. We will respond to your request within the timeframe required by applicable law.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">7. CHILDREN'S PRIVACY</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our Services are not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
                </p>
                <p>
                  If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">8. INTERNATIONAL DATA TRANSFERS</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws than your country.
                </p>
                <p>
                  When we transfer your information internationally, we implement appropriate safeguards to protect your data, including:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Standard contractual clauses approved by relevant authorities</li>
                  <li>Adequacy decisions recognizing equivalent data protection</li>
                  <li>Certification schemes and codes of conduct</li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">9. CHANGES TO THIS PRIVACY POLICY</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make changes, we will:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                  <li>Post the updated Privacy Policy on our website</li>
                  <li>Update the "Last Updated" date at the top of this policy</li>
                  <li>Notify you of material changes via email or through our Services</li>
                  <li>Obtain your consent for material changes where required by law</li>
                </ul>
                <p>
                  Your continued use of our Services after any changes indicates your acceptance of the updated Privacy Policy.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">10. CONTACT US</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-muted/30 p-6 rounded-lg mt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">USA Luxury Limo Service</h3>
                  <div className="space-y-2">
                    <p><strong>Address:</strong> 12026 Fairquarter Ln, Pinehurst, TX 77362</p>
                    <p><strong>Phone:</strong> <a href="tel:+18324796515" className="text-primary hover:underline" data-testid="link-phone">(832) 479-6515</a></p>
                    <p><strong>Email:</strong> <a href="mailto:usaluxurylimo@gmail.com" className="text-primary hover:underline" data-testid="link-email">usaluxurylimo@gmail.com</a></p>
                    <p><strong>Privacy Officer:</strong> <a href="mailto:privacy@usaluxurylimo.com" className="text-primary hover:underline" data-testid="link-privacy-email">privacy@usaluxurylimo.com</a></p>
                  </div>
                </div>
                <p>
                  We will respond to your inquiry within 30 days or as required by applicable law.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mt-16 p-8 bg-muted/30 rounded-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6">Questions About Your Privacy?</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Data Protection Rights</h3>
                  <p className="text-muted-foreground mb-4">
                    You have rights regarding your personal data. Contact us to exercise your rights or if you have privacy concerns.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Need Help?</h3>
                  <p className="text-muted-foreground mb-4">
                    Our customer support team is available to assist with any privacy-related questions.
                  </p>
                  <Button 
                    onClick={() => {
                      setLocation('/');
                      setTimeout(() => {
                        const element = document.querySelector('#contact');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                    data-testid="button-contact-us"
                  >
                    Contact Us
                  </Button>
                </div>
              </div>
            </section>

            {/* Last Updated */}
            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground">
                This Privacy Policy was last updated on September 29, 2025
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}