import Header from '@/components/Header';
import Hero from '@/components/Hero';
import SocialProof from '@/components/SocialProof';
import HowItWorks from '@/components/HowItWorks';
import Benefits from '@/components/Benefits';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';
import SignupForm from '@/components/SignupForm';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-[#ff5722] selection:text-white">
      {/* Fixed Navigation Bar */}
      <Header />

      {/* Main Page Content */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Impact Social Proof Metrics */}
        <SocialProof />

        {/* 3. How It Works (4 Steps) */}
        <HowItWorks />

        {/* 4. Creator Benefits & Differentials */}
        <Benefits />

        {/* 5. Transparent Commission & Pricing */}
        <Pricing />

        {/* 6. Frequently Asked Questions */}
        <FAQ />

        {/* 7. Creator Signup Form (Zod + Supabase) */}
        <SignupForm />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
