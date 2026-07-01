import BottomCTASection from '@/components/landing/BottomCTASection'
import DownloadSection from '@/components/landing/DownloadSection'
import Hero from '@/components/landing/Hero'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import PainPointsSection from '@/components/landing/PainPointsSection'
import SolutionSection from '@/components/landing/SolutionSection'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <PainPointsSection />
      <SolutionSection />
      <HowItWorksSection />
      <DownloadSection />
      <BottomCTASection />
    </>
  )
}
