import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/layout/Hero';
import Features from '@/components/layout/Features';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </>
  );
}
