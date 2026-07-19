import AdExposureSection from '@/components/landing/AdExposureSection'
import AutomationSection from '@/components/landing/AutomationSection'
import BottomCTASection from '@/components/landing/BottomCTASection'
import DownloadSection from '@/components/landing/DownloadSection'
import FAQSection from '@/components/landing/FAQSection'
import Hero from '@/components/landing/Hero'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import IndustriesSection from '@/components/landing/IndustriesSection'
import JsonLd from '@/components/landing/JsonLd'
import PainPointsSection from '@/components/landing/PainPointsSection'
import PricingSection from '@/components/landing/PricingSection'
import SolutionSection from '@/components/landing/SolutionSection'

export default function LandingPage() {
  return (
    <>
      <JsonLd />
      <Hero />
      <PainPointsSection />
      <SolutionSection />
      <IndustriesSection />
      <AutomationSection />
      <AdExposureSection />
      <PricingSection />
      <HowItWorksSection />
      <DownloadSection />
      <FAQSection />
      <BottomCTASection />
    </>
  )
}
