import Navbar from "@/components/Navbar";
import PrioritySection from "@/components/PrioritySection";
import Hero from "@/components/Hero";
import SubscriptionSection from "@/components/SubscriptionSection";
import FeaturedFoods from "@/components/FeaturedFoods";
import MenuSection from "@/components/MenuSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import GallerySection from "@/components/GallerySection";
import Testimonials from "@/components/Testimonials";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";
import OfferBanner from "@/components/OfferBanner";

export default function Home() {
  return (
    <>
      <Navbar />

      <OfferBanner />

      <Hero />

      {/* Priority Audience */}
      <PrioritySection />

      <SubscriptionSection />
      

      {/* Existing sections */}
      <FeaturedFoods />

      <MenuSection />

      <WhyChooseUs />

      <GallerySection />

      <Testimonials />

      <CtaSection />

      <Footer />

      <FloatingContact />
    </>
  );
}