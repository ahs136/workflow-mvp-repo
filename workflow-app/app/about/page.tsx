'use client';

import About from "@/components/About/About";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { useEffect } from "react";

export default function AboutPage() {


    return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gradient-to-br from-secondary to-primary relative">

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-start p-8 pt-24 pb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-8 text-center tracking-tight">
            About WorkFlow
          </h1>
          <About />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
