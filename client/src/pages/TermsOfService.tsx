import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function TermsOfService() {
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
                <FileText className="w-16 h-16 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="terms-title">
                Terms & Conditions
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                USA Luxury Limo Terms and Conditions
              </p>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="prose prose-lg max-w-none">
            
            {/* Table of Contents */}
            <div className="bg-muted/30 p-6 rounded-lg mb-12">
              <h2 className="text-xl font-semibold text-foreground mb-4">Table of Contents</h2>
              <ol className="space-y-2 text-muted-foreground">
                <li><a href="#section-1" className="hover:text-primary transition-colors" data-testid="toc-link-1">1. General Provisions</a></li>
                <li><a href="#section-2" className="hover:text-primary transition-colors" data-testid="toc-link-2">2. Contractual Relationship and Contract Conclusion</a></li>
                <li><a href="#section-3" className="hover:text-primary transition-colors" data-testid="toc-link-3">3. Registration Obligation of the User for the Use of the ULL Tools</a></li>
                <li><a href="#section-4" className="hover:text-primary transition-colors" data-testid="toc-link-4">4. Selected Content of the Transportation Contract for the Benefit of the User</a></li>
                <li><a href="#section-5" className="hover:text-primary transition-colors" data-testid="toc-link-5">5. Remuneration and Payment</a></li>
                <li><a href="#section-6" className="hover:text-primary transition-colors" data-testid="toc-link-6">6. Liability</a></li>
                <li><a href="#section-7" className="hover:text-primary transition-colors" data-testid="toc-link-7">7. Amendment of the Offer by USA Luxury Limo</a></li>
                <li><a href="#section-8" className="hover:text-primary transition-colors" data-testid="toc-link-8">8. Protection of Content, Grant of Rights of Use to ULL Tools</a></li>
                <li><a href="#section-9" className="hover:text-primary transition-colors" data-testid="toc-link-9">9. Final Provisions</a></li>
              </ol>
            </div>

            {/* Section 1 */}
            <section id="section-1" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">1. GENERAL PROVISIONS</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  USA Luxury Limo Service, 12026 Fairquarter Ln Pinehurst, TX 77362 (hereinafter referred to as "USA Luxury Limo (ULL)") enables its users to book transportation services via its own online platform by integrating third-party online platforms and applications for mobile devices ("apps"; all methods collectively referred to as "ULL Tools"). USA Luxury Limo's service consists of arranging for the transportation of a user by an independent ride service provider (Transportation Service Provider or "TSP"). USA Luxury Limo arranges this business service for the user but does not in provide the actual transportation service in all locations and for each ride requests.
                </p>
                <p>
                  These General Terms and Conditions (hereinafter referred to as "T&Cs") are part of each agreement of the user concerning USA Luxury Limo's arrangement of business service contracts. They also describe the details of the transportation services for which USA Luxury Limo provides the user a direct claim against a particular TSP.
                </p>
                <p>
                  Conflicting general terms and conditions of the user are hereby also contradicted in the case of confirmation letters and services accepted without condition. Any terms to the contrary shall only apply insofar as the management of USA Luxury Limo has expressly consented to this in writing.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">2. CONTRACTUAL RELATIONSHIP AND CONTRACT CONCLUSION</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">2.1 CONTRACTUAL RELATIONSHIP</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    USA Luxury Limo does not itself provide the transportation services in connection with the ULL Tools and does not do so by way of third-party agents. USA Luxury Limo only provides the user with a claim for transport against a TSP, which is independent of USA Luxury Limo.
                  </p>
                  <p>
                    For this purpose, USA Luxury Limo concludes the necessary agreements on its own behalf with the TSP that provide the user with a claim for transport against the TSP ("contract for the benefit of third parties", also "transportation contract for the benefit of the user"). On this basis, the user is entitled to request the transportation service and any further claims in respect of that service directly from the TSP.
                  </p>
                  <p>
                    USA Luxury Limo and the user only agree to the arrangement of a business service contract and not to the arrangement of the actual transportation services. The claim for compensation by USA Luxury Limo includes the compensation for arranging business services as well as the compensation distributed to the TSP for the transportation services.
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">2.2 CONCLUSION OF CONTRACT</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    By transmitting a completed booking form via the ULL Tools or by making arrangements by telephone with USA Luxury Limo, the user transmits an offer to conclude a business service contract ("ride request" of the user). The subject matter of this contract is the provision of the ride service requested by the user.
                  </p>
                  <p>
                    As an initial matter, USA Luxury Limo transmits to the user an email confirmation of the details of the requested ride service that it has received. In so doing, USA Luxury Limo only confirms the receipt of the user's ride request.
                  </p>
                  <p>
                    It is only by separate declaration ("booking confirmation") by email from USA Luxury Limo that the business service contract between USA Luxury Limo and the user is concluded for the desired ride service. The user is then directly entitled vis-à-vis the TSP to request the ride service of the TSP and to assert further claims in respect of such ride service directly against the TSP.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">3. REGISTRATION OBLIGATION OF THE USER FOR THE USE OF THE ULL TOOLS</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The user provides assurance to USA Luxury Limo that all information it transmits or has transmitted to USA Luxury Limo on its behalf by another person is complete and accurate. Registrations by automated processes are prohibited.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">4. SELECTED CONTENT OF THE TRANSPORTATION CONTRACT FOR THE BENEFIT OF THE USER</h2>
              <div className="space-y-4 text-muted-foreground mb-8">
                <p>
                  The user can only request the details for a user's ride request described under Section 4 from the TSP if this has been agreed with USA Luxury Limo in the business service contract.
                </p>
                <p>
                  The following conditions apply to the claim for transportation of the user to be asserted directly against the TSP and to be procured by USA Luxury Limo:
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">4.1 RIDE TYPES, SERVICE CHANGES</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Depending on local availability, the user can select ride requests that include transfer rides, long-distance rides (transfer rides starting at 200 km), rides on demand ("chauffeur hailing") and hourly bookings.
                  </p>
                  <p>
                    If the ride actually carried out involves additional expenditure of effort due to the user's or guest's requests that differ from the initially requested ride, the TSP will accommodate these requests to the extent possible. The additional effort may result in additional costs for the individual business service contract. See Section 5 below for details.
                  </p>
                  <p>
                    Subject to availability, a user may request changes to the ride even after the conclusion of the contract but this may result in additional charges being applied, as described in Section 5.2.
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">4.2 PICKUP TIME</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    The agreed pickup time is the pickup time specified in the USA Luxury Limo booking confirmation.
                  </p>
                  <p>
                    In the event of an airport pickup or pickup at a long-distance train station for which the user has provided a correct flight or train number in its booking, thus enabling USA Luxury Limo to track of the arrival time of the flight or train, the agreed pickup time will be postponed in case the flight or train are late.
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">4.3 VEHICLE CLASS/VEHICLE MODEL, UPGRADE</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Depending on the regional availability of the vehicle, the user can choose from different vehicle classes in its ride request (for example, "Business Class", "Business Van/SUV", "First Class Sedan", "First Class Van/SUV" or "Electric Class" etc.).
                  </p>
                  <p>
                    The vehicles shown in the ULL Tools are only illustrative examples. There is no right to a particular vehicle model associated with a booked vehicle class Regional differences are possible.
                  </p>
                  <p>
                    It is possible for USA Luxury Limo to upgrade from the vehicle class "Business Class" to a higher vehicle class (such as "Business Van" or "First Class") at any time at no additional cost for the user, depending on availability.
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">4.4 TRANSPORT SAFETY, CONSEQUENCES</h3>
                
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-foreground mb-3">4.4.1 LUGGAGE, ANIMALS</h4>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      The price in the booking confirmation includes the number of pieces of luggage that were specified in the booking form.
                    </p>
                    <p>
                      Excess luggage, bulky luggage such as a wheelchair, weapons or animals that the user wishes to carry along must be specified during the booking. The TSP may refuse the transport of luggage, weapons and/or animals that have not been agreed upon; this also applies if animals are not housed in a closed and suitable transport box. The right of refusal does not exist if local statutory provisions of the region in which the transport is carried out require that the items be accommodated.
                    </p>
                    <p>
                      If the TSP permits the carriage of additional luggage, weapons and/or animals that were not stipulated in the booking, additional surcharges may be charged. This may result in the total charges for the business service contract to be higher than initially specified in the booking confirmation (see Section 5 below).
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-medium text-foreground mb-3">4.4.2 TRANSPORT OF CHILDREN AND MINORS</h4>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      <strong>(A) CHILDREN</strong> The need for child restraints must be specified by the user in the ride request by specifying the number and age of the children to be transported as well as the type of child restraints required.
                    </p>
                    <p>
                      <strong>(B) MINORS</strong> The transport of unaccompanied minors can be rejected by the TSP. The determination of minor status will be made in accordance with the statutory provisions of the region in which the transport is to be performed.
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-medium text-foreground mb-3">4.4.3 INFORMATION ON NUMBER OF PASSENGERS, NUMBER AND SIZE OF LUGGAGE</h4>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      The maximum number of passengers, number and size of pieces of luggage will be provided by USA Luxury Limo for a specific vehicle and is set out in a binding luggage policy.
                    </p>
                    <p>
                      The TSP may refuse to transport passengers or luggage if, in its opinion, the space and safety conditions do not permit such transport.
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-medium text-foreground mb-3">4.4.4 IMPEDED TRANSPORT</h4>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      The TSP may refuse to transport a user if mandatory requirements (for example, resulting from applicable law) pursuant to this Section 4.3 have not been communicated or were not correctly communicated by the user in its ride request.
                    </p>
                    <p>
                      If transport is not possible for this reason, USA Luxury Limo shall still be entitled to compensation from the user under the business service contract for that specific transportation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">4.5 DELAYS</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Exceptional situations such as striking air traffic controllers, inclement weather conditions, etc. can only be compensated to a limited extent. In these cases, longer waiting times or short-notice cancellations must be accepted by the user.
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">4.6 CANCELLATIONS, REBOOKINGS AND NO-SHOW RIDES</h3>
                
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-foreground mb-3">4.6.1 CANCELLATION</h4>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      For transfer rides, long-distance rides (transfer rides starting at 100 miles) and hourly bookings, the cancellation is free if the time between the cancellation and the agreed pickup time is greater than one hour. If the time between the cancellation and the agreed pickup time is one hour or less, the full price must be paid. An effective cancellation can only be carried out using the cancellation function on the website or in the app.
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-medium text-foreground mb-3">4.6.2 REBOOKINGS</h4>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Rebookings are generally treated as new bookings. The regulations for the handling of cancellations (Section 4.5.1 above) apply accordingly for the originally agreed ride. Accordingly, a claim for compensation by USA Luxury Limo for the originally agreed ride may remain in force.
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-medium text-foreground mb-3">4.6.3 NO-SHOW RIDES WITHOUT CANCELLATION, USER'S DELAY</h4>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      In the event that a user does not show up for a ride and does not cancel it (a "no show"), the user's claim for transport vis-à-vis the TSP shall no longer be applicable; however, USA Luxury Limo's shall still be entitled to compensation from the user.
                    </p>
                    <p>
                      <strong>(A) FOR TRANSFER AND LONG-DISTANCE RIDES</strong> A ride is considered to be a no-show if the User or guest does not appear within 30 minutes after the agreed pickup time at the agreed pickup location.
                    </p>
                    <p>
                      In the event of pickup at airports or long-distance train stations, a ride is considered to be a no-show if the User or guest does not appear within 60 minutes after the agreed pickup time at the agreed pickup location.
                    </p>
                    <p>
                      <strong>(B) HOURLY BOOKING</strong> A ride is considered to be a no-show if the User or guest does not appear at the agreed pickup location after the end of the booked hours (calculated from the scheduled pickup time).
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">4.7 BEHAVIOR IN THE LIMOUSINE</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    The following behavioral standards apply to the users of the TSP's transport services:
                  </p>
                  <p>
                    During the entire ride, applicable road traffic rules and regulations apply to all guests, particularly the obligation to wear a seat belt. The TSP's instructions must always be followed. The TSP bears the responsibility for safely completing the ride. Therefore, the guests are prohibited from opening the doors during the ride, throwing objects out of the vehicle and/or hanging out any part of the body or screaming from the vehicle. If guests wish to use any equipment or systems present in the respective vehicle, prior permission from the TSP is required.
                  </p>
                  <p>
                    Smoking is prohibited in the passenger compartment of the vehicles. If the user or a guest ignores this, the user must bear the costs of a vehicle cleaning and the resulting loss of serviceability.
                  </p>
                  <p>
                    The consumption of food is discouraged. Alcohol consumption is prohibited unless specifically permitted by the TSP and local regulations.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">5. REMUNERATION AND PAYMENT</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">5.1 PAYMENT TERMS</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Payment for transportation services is due according to the payment terms specified in the booking confirmation. USA Luxury Limo accepts major credit cards (Visa, MasterCard, American Express, Discover) and may require a deposit at the time of booking.
                  </p>
                  <p>
                    For corporate accounts, billing terms may be arranged separately. All prices quoted are subject to applicable taxes and fees.
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">5.2 ADDITIONAL CHARGES</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Additional charges may apply for services beyond the scope of the original booking, including but not limited to: overtime fees, additional stops, waiting time beyond the included allowance, tolls, parking fees, and cleaning fees for excessive mess or damage to the vehicle.
                  </p>
                  <p>
                    Gratuity for the chauffeur is not included in the base price unless specifically stated otherwise.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">6. LIABILITY</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">6.1 LIMITATION OF LIABILITY</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    USA Luxury Limo's liability is limited to the greatest extent permitted by applicable law. The company shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses.
                  </p>
                  <p>
                    In no event shall USA Luxury Limo's total liability exceed the amount paid by the user for the specific transportation service giving rise to the claim.
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">6.2 FORCE MAJEURE</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    USA Luxury Limo shall not be liable for any failure or delay in performance due to circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, labor disputes, government actions, or failure of transportation infrastructure.
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">6.3 USER LIABILITY</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Users are liable for any damage to vehicles caused by their actions or the actions of their guests, including but not limited to excessive cleaning costs, repairs, and lost revenue during vehicle downtime.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">7. AMENDMENT OF THE OFFER BY USA LUXURY LIMO</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  USA Luxury Limo reserves the right to modify these Terms and Conditions at any time without prior notice. Changes will be effective immediately upon posting on the website. Users are encouraged to review these terms periodically.
                </p>
                <p>
                  Continued use of USA Luxury Limo's services after any such changes constitutes acceptance of the new Terms and Conditions.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">8. PROTECTION OF CONTENT, GRANT OF RIGHTS OF USE TO ULL TOOLS</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  All content, software, images, text, graphics, illustrations, logos, patents, trademarks, service marks, copyrights, photographs, audio, videos, music on and "look and feel" of the ULL Tools are protected by applicable intellectual property laws.
                </p>
                <p>
                  Users are granted a limited, non-exclusive, non-transferable license to use the ULL Tools solely for booking transportation services. This license does not include any resale or commercial use of the ULL Tools or their contents.
                </p>
                <p>
                  Users may not modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any information, software, products, or services obtained from the ULL Tools.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">9. FINAL PROVISIONS</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">9.1 GOVERNING LAW</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    These Terms and Conditions shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions.
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">9.2 DISPUTE RESOLUTION</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Any disputes arising out of or relating to these Terms and Conditions or the use of USA Luxury Limo's services shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">9.3 SEVERABILITY</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    If any provision of these Terms and Conditions is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms and Conditions shall otherwise remain in full force and effect.
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-4">9.4 ENTIRE AGREEMENT</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    These Terms and Conditions constitute the entire agreement between USA Luxury Limo and the user regarding the subject matter hereof and supersede all prior or contemporaneous understandings, whether written or oral.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mt-16 p-8 bg-muted/30 rounded-lg">
              <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">USA Luxury Limo Service</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p><strong>Phone:</strong> <a href="tel:+18324796515" className="text-primary hover:underline" data-testid="link-phone">(832) 479-6515</a></p>
                    <p><strong>Email:</strong> <a href="mailto:usaluxurylimo@gmail.com" className="text-primary hover:underline" data-testid="link-email">usaluxurylimo@gmail.com</a></p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Questions?</h3>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about these Terms of Service, please contact us using the information provided.
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
                Last updated: September 2025
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}