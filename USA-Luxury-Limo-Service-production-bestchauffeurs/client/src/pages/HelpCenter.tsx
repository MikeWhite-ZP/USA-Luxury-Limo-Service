import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HelpCircle, ArrowLeft, MessageCircle, Phone, Mail, Clock, Calendar, CreditCard, Users, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpCenter() {
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
                <HelpCircle className="w-16 h-16 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="help-center-title">
                Help Center
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Find answers to frequently asked questions about our luxury transportation services.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-muted/30 p-6 rounded-lg text-center">
              <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="quick-link-phone-title">Call Us</h3>
              <p className="text-muted-foreground mb-4">Available 24/7 for immediate assistance</p>
              <a 
                href="tel:+18324796515" 
                className="text-primary hover:underline font-medium"
                data-testid="quick-link-phone"
              >
                (832) 479-6515
              </a>
            </div>
            
            <div className="bg-muted/30 p-6 rounded-lg text-center">
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="quick-link-email-title">Email Support</h3>
              <p className="text-muted-foreground mb-4">Get detailed assistance via email</p>
              <a 
                href="mailto:usaluxurylimo@gmail.com" 
                className="text-primary hover:underline font-medium"
                data-testid="quick-link-email"
              >
                usaluxurylimo@gmail.com
              </a>
            </div>
            
            <div className="bg-muted/30 p-6 rounded-lg text-center">
              <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="quick-link-chat-title">Live Chat</h3>
              <p className="text-muted-foreground mb-4">Chat with our support team</p>
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
                data-testid="quick-link-chat"
              >
                Start Chat
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12" data-testid="faq-title">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            
            {/* Booking & Reservations */}
            <div>
              <div className="flex items-center mb-6">
                <Calendar className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold" data-testid="section-booking-title">Booking & Reservations</h3>
              </div>
              
              <Accordion type="single" collapsible>
                <AccordionItem value="booking-1" data-testid="faq-booking-1">
                  <AccordionTrigger data-testid="faq-booking-1-trigger">How do I book a ride with USA Luxury Limo?</AccordionTrigger>
                  <AccordionContent data-testid="faq-booking-1-content">
                    You can book a ride through multiple convenient methods:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Online through our website booking system</li>
                      <li>Call us directly at (832) 479-6515</li>
                      <li>Download our mobile app (USA Luxury Limo Service)</li>
                      <li>Email us at usaluxurylimo@gmail.com</li>
                    </ul>
                    We're available 24/7 to assist with your reservations.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="booking-2" data-testid="faq-booking-2">
                  <AccordionTrigger data-testid="faq-booking-2-trigger">How far in advance should I book?</AccordionTrigger>
                  <AccordionContent data-testid="faq-booking-2-content">
                    We recommend booking at least 24 hours in advance to ensure vehicle availability. For special events like weddings, proms, or corporate events, we suggest booking 2-4 weeks ahead. However, we do accept last-minute bookings subject to availability, and our 24/7 service means we can often accommodate same-day requests.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="booking-3" data-testid="faq-booking-3">
                  <AccordionTrigger data-testid="faq-booking-3-trigger">Do I need to create an account to book?</AccordionTrigger>
                  <AccordionContent data-testid="faq-booking-3-content">
                    While you can make one-time bookings without an account, creating an account provides several benefits:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Easy access to your booking history</li>
                      <li>Saved payment methods and addresses</li>
                      <li>Exclusive member deals and promotions</li>
                      <li>Faster booking process for future rides</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="booking-4" data-testid="faq-booking-4">
                  <AccordionTrigger data-testid="faq-booking-4-trigger">Can I modify or cancel my booking?</AccordionTrigger>
                  <AccordionContent data-testid="faq-booking-4-content">
                    Yes, you can modify or cancel your booking. Our cancellation policy varies by service type:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li><strong>Airport transfers:</strong> Cancel 24+ hours in advance for full refund</li>
                      <li><strong>Hourly service:</strong> Cancel 48+ hours in advance for minimal fees</li>
                      <li><strong>Special events:</strong> Cancel 4-7 days in advance depending on event type</li>
                      <li><strong>Cancellation within 24 hours:</strong> May incur charges if driver has been dispatched</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Pricing & Payment */}
            <div>
              <div className="flex items-center mb-6">
                <CreditCard className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold" data-testid="section-pricing-title">Pricing & Payment</h3>
              </div>
              
              <Accordion type="single" collapsible>
                <AccordionItem value="pricing-1" data-testid="faq-pricing-1">
                  <AccordionTrigger data-testid="faq-pricing-1-trigger">How is pricing calculated?</AccordionTrigger>
                  <AccordionContent data-testid="faq-pricing-1-content">
                    Our pricing is based on several factors:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li><strong>Vehicle type:</strong> Business Sedan, SUV, First-Class vehicles, or Business VAN</li>
                      <li><strong>Service type:</strong> Airport transfer, hourly service, or point-to-point</li>
                      <li><strong>Distance and duration:</strong> For transfers and hourly bookings</li>
                      <li><strong>Time of service:</strong> Peak hours and special events may have premium pricing</li>
                      <li><strong>Additional services:</strong> Extra stops, wait time, special requests</li>
                    </ul>
                    All pricing is transparent and provided upfront during booking.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pricing-2" data-testid="faq-pricing-2">
                  <AccordionTrigger data-testid="faq-pricing-2-trigger">What payment methods do you accept?</AccordionTrigger>
                  <AccordionContent data-testid="faq-pricing-2-content">
                    We accept all major credit cards including:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Visa</li>
                      <li>MasterCard</li>
                      <li>American Express</li>
                      <li>Discover</li>
                    </ul>
                    Payment is processed securely through Stripe. Your card is pre-authorized at booking and charged after service completion. We also offer corporate billing for business accounts.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pricing-3" data-testid="faq-pricing-3">
                  <AccordionTrigger data-testid="faq-pricing-3-trigger">Are there minimum time requirements?</AccordionTrigger>
                  <AccordionContent data-testid="faq-pricing-3-content">
                    Yes, we have minimum time requirements for hourly services:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li><strong>Weekdays:</strong> 2-3 hours minimum</li>
                      <li><strong>Weekends:</strong> 3-4 hours minimum</li>
                      <li><strong>Special events:</strong> 4-6 hours minimum</li>
                      <li><strong>Weddings:</strong> 5 hours minimum</li>
                    </ul>
                    Airport transfers and point-to-point trips have no minimum time requirements.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pricing-4" data-testid="faq-pricing-4">
                  <AccordionTrigger data-testid="faq-pricing-4-trigger">Is gratuity included in the price?</AccordionTrigger>
                  <AccordionContent data-testid="faq-pricing-4-content">
                    Gratuity is not automatically included in the base price. A standard gratuity of 15-20% is customary and greatly appreciated by our professional chauffeurs. You can add gratuity during the booking process or provide it directly to your chauffeur after service.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pricing-5" data-testid="faq-pricing-5">
                  <AccordionTrigger data-testid="faq-pricing-5-trigger">Are there additional fees?</AccordionTrigger>
                  <AccordionContent data-testid="faq-pricing-5-content">
                    Additional fees may apply for:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li><strong>Extra stops:</strong> $20-$30 per additional stop</li>
                      <li><strong>Wait time:</strong> Beyond included wait time</li>
                      <li><strong>Tolls and parking:</strong> When applicable</li>
                      <li><strong>Child seats:</strong> $20-$25 per seat</li>
                      <li><strong>Pet transportation:</strong> $75 cleaning fee</li>
                      <li><strong>Late night service:</strong> Additional fee for 11PM-6AM pickups</li>
                    </ul>
                    All additional fees are disclosed during booking.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Fleet & Vehicles */}
            <div>
              <div className="flex items-center mb-6">
                <Car className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold" data-testid="section-fleet-title">Fleet & Vehicles</h3>
              </div>
              
              <Accordion type="single" collapsible>
                <AccordionItem value="fleet-1" data-testid="faq-fleet-1">
                  <AccordionTrigger data-testid="faq-fleet-1-trigger">What types of vehicles do you offer?</AccordionTrigger>
                  <AccordionContent data-testid="faq-fleet-1-content">
                    Our premium fleet includes:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li><strong>Business Sedan:</strong> Up to 3 passengers - Perfect for business travel and airport transfers</li>
                      <li><strong>Business SUV:</strong> Up to 5 passengers - Ideal for families or small groups</li>
                      <li><strong>First-Class SUV:</strong> Up to 5 passengers - Premium luxury experience</li>
                      <li><strong>First-Class Sedan:</strong> Up to 2 passengers - Executive-level comfort</li>
                      <li><strong>Business VAN:</strong> Up to 12 passengers - Perfect for larger groups</li>
                    </ul>
                    All vehicles are meticulously maintained and equipped with luxury amenities.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="fleet-2" data-testid="faq-fleet-2">
                  <AccordionTrigger data-testid="faq-fleet-2-trigger">What amenities are included in your vehicles?</AccordionTrigger>
                  <AccordionContent data-testid="faq-fleet-2-content">
                    Our vehicles come equipped with premium amenities:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Complimentary Wi-Fi</li>
                      <li>Refreshments and bottled water</li>
                      <li>Entertainment systems</li>
                      <li>Climate control</li>
                      <li>Luxury leather seating</li>
                      <li>Privacy partitions (where applicable)</li>
                      <li>Phone chargers and outlets</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="fleet-3" data-testid="faq-fleet-3">
                  <AccordionTrigger data-testid="faq-fleet-3-trigger">Are your vehicles regularly maintained and inspected?</AccordionTrigger>
                  <AccordionContent data-testid="faq-fleet-3-content">
                    Absolutely. All our vehicles undergo rigorous maintenance and safety inspections. We maintain our fleet to the highest standards to ensure your safety, comfort, and reliability. Our vehicles are regularly serviced, detailed, and inspected according to industry standards and local regulations.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="fleet-4" data-testid="faq-fleet-4">
                  <AccordionTrigger data-testid="faq-fleet-4-trigger">Can you accommodate special requests or accessibility needs?</AccordionTrigger>
                  <AccordionContent data-testid="faq-fleet-4-content">
                    Yes, we strive to accommodate special requests and accessibility needs. This includes:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Child safety seats (additional fee applies)</li>
                      <li>Pet transportation with carriers</li>
                      <li>Wheelchair accessibility (advance notice required)</li>
                      <li>Special occasion decorations</li>
                      <li>Specific vehicle requests</li>
                    </ul>
                    Please mention any special requirements when booking so we can ensure proper arrangements.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Service Areas & Chauffeurs */}
            <div>
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold" data-testid="section-service-title">Service Areas & Chauffeurs</h3>
              </div>
              
              <Accordion type="single" collapsible>
                <AccordionItem value="service-1" data-testid="faq-service-1">
                  <AccordionTrigger data-testid="faq-service-1-trigger">What areas do you serve?</AccordionTrigger>
                  <AccordionContent data-testid="faq-service-1-content">
                    We provide luxury transportation services throughout the Houston metropolitan area, including:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Downtown Houston</li>
                      <li>The Galleria/Uptown</li>
                      <li>Sugar Land, TX</li>
                      <li>Katy, TX</li>
                      <li>The Woodlands, TX</li>
                      <li>Pearland, TX</li>
                      <li>Tomball, TX</li>
                      <li>College Station, TX</li>
                      <li>All Houston area airports (IAH, HOU, private airports)</li>
                    </ul>
                    Contact us for service to areas not listed above.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="service-2" data-testid="faq-service-2">
                  <AccordionTrigger data-testid="faq-service-2-trigger">What can I expect from your chauffeurs?</AccordionTrigger>
                  <AccordionContent data-testid="faq-service-2-content">
                    Our professional chauffeurs are:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>Licensed and experienced professionals</li>
                      <li>Background checked and drug tested</li>
                      <li>Trained in customer service excellence</li>
                      <li>Knowledgeable about local areas and routes</li>
                      <li>Professionally dressed in business attire</li>
                      <li>Committed to punctuality and discretion</li>
                    </ul>
                    Your chauffeur will assist with luggage, provide local insights, and ensure your comfort throughout the journey.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="service-3" data-testid="faq-service-3">
                  <AccordionTrigger data-testid="faq-service-3-trigger">Do you provide airport transfer services?</AccordionTrigger>
                  <AccordionContent data-testid="faq-service-3-content">
                    Yes, airport transfers are one of our specialties. We provide service to and from:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>George Bush Intercontinental Airport (IAH)</li>
                      <li>William P. Hobby Airport (HOU)</li>
                      <li>Private airports and FBOs</li>
                    </ul>
                    Our airport service includes real-time flight tracking, complimentary wait time, and meet-and-greet service. We monitor your flight status to ensure timely pickups even if your flight is delayed.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="service-4" data-testid="faq-service-4">
                  <AccordionTrigger data-testid="faq-service-4-trigger">What is your availability?</AccordionTrigger>
                  <AccordionContent data-testid="faq-service-4-content">
                    USA Luxury Limo Service operates 24 hours a day, 7 days a week, 365 days a year. Whether you need an early morning airport transfer, late-night event transportation, or holiday service, we're available to serve you. Our customer service team is also available 24/7 to assist with bookings and questions.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Policies & Safety */}
            <div>
              <div className="flex items-center mb-6">
                <Clock className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold" data-testid="section-policies-title">Policies & Safety</h3>
              </div>
              
              <Accordion type="single" collapsible>
                <AccordionItem value="policies-1" data-testid="faq-policies-1">
                  <AccordionTrigger data-testid="faq-policies-1-trigger">What is your on-time guarantee?</AccordionTrigger>
                  <AccordionContent data-testid="faq-policies-1-content">
                    We pride ourselves on punctuality. Our chauffeurs arrive 10-15 minutes before your scheduled pickup time. For airport pickups, we track your flight and adjust pickup times accordingly. If we're late due to our error (not traffic or other external factors), we'll work to make it right with our customers.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="policies-2" data-testid="faq-policies-2">
                  <AccordionTrigger data-testid="faq-policies-2-trigger">What safety measures do you have in place?</AccordionTrigger>
                  <AccordionContent data-testid="faq-policies-2-content">
                    Your safety is our top priority:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li>All chauffeurs undergo comprehensive background checks</li>
                      <li>Regular drug and alcohol testing</li>
                      <li>Vehicles are regularly inspected and maintained</li>
                      <li>Commercial insurance coverage</li>
                      <li>GPS tracking for all vehicles</li>
                      <li>24/7 dispatch monitoring</li>
                      <li>Emergency communication systems</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="policies-3" data-testid="faq-policies-3">
                  <AccordionTrigger data-testid="faq-policies-3-trigger">What happens if my flight is delayed?</AccordionTrigger>
                  <AccordionContent data-testid="faq-policies-3-content">
                    We monitor all flights in real-time using advanced flight tracking systems. If your flight is delayed, we automatically adjust your pickup time at no additional charge. For airport pickups, we include complimentary wait time to account for deplaning, baggage claim, and customs (for international flights). No need to worry about calling us - we're already tracking your flight.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="policies-4" data-testid="faq-policies-4">
                  <AccordionTrigger data-testid="faq-policies-4-trigger">Can I make changes to my booking after confirmation?</AccordionTrigger>
                  <AccordionContent data-testid="faq-policies-4-content">
                    Yes, you can make changes to your booking subject to vehicle availability and our modification policy:
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      <li><strong>Time changes:</strong> At least 2 hours notice preferred</li>
                      <li><strong>Date changes:</strong> Subject to availability</li>
                      <li><strong>Vehicle changes:</strong> May require price adjustment</li>
                      <li><strong>Route changes:</strong> May affect pricing</li>
                    </ul>
                    Contact our customer service team at (832) 479-6515 to make modifications.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-16 p-8 bg-muted/30 rounded-lg">
            <h2 className="text-2xl font-bold text-center mb-6" data-testid="contact-section-title">Still Have Questions?</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <Phone className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Call Us</h3>
                <p className="text-muted-foreground mb-3">24/7 Customer Support</p>
                <a 
                  href="tel:+18324796515" 
                  className="text-primary hover:underline font-medium"
                  data-testid="contact-phone"
                >
                  (832) 479-6515
                </a>
              </div>
              
              <div>
                <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Email Us</h3>
                <p className="text-muted-foreground mb-3">Get detailed assistance</p>
                <a 
                  href="mailto:usaluxurylimo@gmail.com" 
                  className="text-primary hover:underline font-medium"
                  data-testid="contact-email"
                >
                  usaluxurylimo@gmail.com
                </a>
              </div>
              
              <div>
                <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Live Chat</h3>
                <p className="text-muted-foreground mb-3">Instant support</p>
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
                  data-testid="contact-chat"
                >
                  Start Chat
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}