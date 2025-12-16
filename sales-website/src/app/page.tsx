import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ModuleShowcase from '@/components/ModuleShowcase'
import PricingCalculator from '@/components/PricingCalculator'
import ComparisonTable from '@/components/ComparisonTable'
import HowItWorks from '@/components/HowItWorks'
import UseCases from '@/components/UseCases'
import FAQ from '@/components/FAQ'
import ContactCTA from '@/components/ContactCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <ModuleShowcase />
      <PricingCalculator />
      <ComparisonTable />
      <HowItWorks />
      <UseCases />
      <FAQ />
      <ContactCTA />
      <Footer />
    </main>
  )
}
