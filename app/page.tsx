"use client";

import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import SpeakerGrid from "@/components/SpeakerGrid";
import Showcase from "@/components/Showcase";
import BentoStats from "@/components/BentoStats";
import JoinCore from "@/components/JoinCore";
import Footer from "@/components/Footer";
import Preloader from "@/components/ui/Preloader";
import { useState } from "react";

export default function Home() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  return (
    <>
      {isRedirecting && <Preloader message="SYNCING" />}
      <NavBar hide={isRedirecting} />
      <main>
        <Hero onRedirect={() => setIsRedirecting(true)} />
        <SpeakerGrid />
        <Showcase />
        <BentoStats />
        <JoinCore />
      </main>
      <Footer />
    </>
  );
}
