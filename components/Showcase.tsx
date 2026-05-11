"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

export default function Showcase() {
  const [step, setStep] = useState(1);
  const container = useRef<HTMLElement>(null);
  const pinDistance = 1900

  // Use GSAP to pin the section and map scroll progress to steps
  useGSAP(() => {
    ScrollTrigger.create({
      trigger: container.current,
      start: "top top",
      end: `+=${pinDistance}`,
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        if (p < 0.25) setStep(1);
        else if (p < 0.50) setStep(2);
        else if (p < 0.75) setStep(3);
        else setStep(4);
      }
    });
  }, { scope: container });

  // Expose global function for redirection from Footer/Hero
  useEffect(() => {
    (window as any).setShowcaseStep = (s: number) => {
      const el = document.getElementById("how-it-works");
      if (el) {
        // Calculate scroll offset based on the step (0, 0.25, 0.5, 0.75 of pinDistance)
        const offsetAmount = (s - 1) * (pinDistance / 4);
        const lenis = (window as any).lenis;
        if (lenis?.scrollTo) {
          lenis.scrollTo(el, { offset: offsetAmount });
        } else {
          window.scrollTo({ top: el.offsetTop + offsetAmount, behavior: "smooth" });
        }
      }
    };
  }, []);

  const stepContent = {
    1: {
      label: "STEP 01 — UPLOAD",
      headline: <>UPLOAD YOUR<br />RESUME</>,
      desc: "Drag and drop your PDF resume. Our AI extracts your experience, skills, and education in seconds."
    },
    2: {
      label: "STEP 02 — REVIEW",
      headline: <>VERIFY YOUR<br />PROFILE</>,
      desc: "Review the AI-extracted data. Add custom skills or projects to ensure your cold emails are perfectly tailored."
    },
    3: {
      label: "STEP 03 — LAUNCH",
      headline: <>START<br />MAILING</>,
      desc: "Generate highly personalized cold emails with a single click. Track your outreach and follow-ups in one place."
    },
    4: {
      label: "STEP 04 — COMPOSE",
      headline: <>CRAFT YOUR<br />MESSAGE</>,
      desc: "Set the tone, define the role, and let ColdCraft write a hyper-personalized email ready to hit send."
    }
  };

  return (
    <section id="how-it-works" ref={container} className="h-screen min-h-[600px] md:min-h-[700px] w-full bg-black relative overflow-hidden flex items-center py-4 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-12 lg:gap-20 items-center w-full">
        
        {/* Left Column: Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-start lg:items-start text-left order-1 lg:order-1"
        >
          <div className="relative grid grid-cols-1 grid-rows-1 w-full">
            {[1, 2, 3, 4].map((s) => (
              <motion.div
                key={s}
                initial={false}
                animate={{ 
                  opacity: step === s ? 1 : 0, 
                  y: step === s ? 0 : (step < s ? 10 : -10),
                  pointerEvents: step === s ? "auto" : "none"
                }}
                transition={{ duration: 0.5 }}
                className="col-start-1 row-start-1 flex flex-col items-start max-w-xl w-full"
              >
                <div className="font-mono text-[10px] md:text-sm tracking-[0.2em] uppercase mb-2 md:mb-4 font-bold text-white shadow-sm opacity-90">
                  {stepContent[s as keyof typeof stepContent].label}
                </div>
                <h2 className="font-headline text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-white drop-shadow-lg mb-4 md:mb-8">
                  {stepContent[s as keyof typeof stepContent].headline}
                </h2>
                <p className="font-body text-sm md:text-lg opacity-60 max-w-md leading-relaxed text-white">
                  {stepContent[s as keyof typeof stepContent].desc}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-4 mt-4 md:mt-12 z-10 w-full relative">
            {[1, 2, 3, 4].map((s) => (
              <button 
                key={s}
                onClick={() => (window as any).setShowcaseStep?.(s)}
                className={`w-12 h-1 ${step === s ? "bg-white" : "bg-white/30"} transition-colors hover:bg-white/60 cursor-pointer`}
                aria-label={`View Step ${s}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Right Column: Showcase Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, x: 30 }}
          whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full bg-black border border-white/20 shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative flex flex-col order-2 lg:order-2 overflow-hidden"
        >
          {/* Fake Window Bar */}
          <div className="h-8 md:h-10 border-b border-white/10 flex items-center px-3 md:px-4 justify-between bg-black/50 shrink-0 z-20 relative">
             <div className="font-headline text-[10px] md:text-sm font-bold tracking-tighter text-white">COLDCRAFT</div>
             <div className="flex gap-1.5">
               <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-black/20" />
               <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-black/20" />
               <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-black/20" />
             </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative bg-[#050505] grid grid-cols-1 grid-rows-1">
            
            <motion.div 
              initial={false}
              animate={{ 
                opacity: step === 1 ? 1 : 0, 
                x: step === 1 ? 0 : -20,
                pointerEvents: step === 1 ? "auto" : "none"
              }}
              transition={{ duration: 0.5 }}
              className="col-start-1 row-start-1 flex flex-col gap-6 md:gap-8 p-4 md:p-8"
            >
              {/* Step 1: Resume Upload Layout */}
              <div className="flex flex-col items-start justify-start shrink-0">
                <h1 className="font-headline font-black text-6xl leading-[0.8] tracking-tighter text-white m-0 p-0">01</h1>
                <h2 className="font-headline font-black uppercase text-4xl leading-[0.85] tracking-tighter text-white mt-4">
                  First, your<br />resume.
                </h2>
              </div>
              
              <div className="flex flex-col items-start w-full mt-4">
                <div className="w-full">
                  <div className="font-body text-[10px] leading-relaxed opacity-60 uppercase tracking-[0.2em] font-bold text-white mb-4">
                    WE EXTRACT EVERYTHING AUTOMATICALLY
                  </div>
                  <div className="border border-dashed border-white/20 bg-white/[0.02] p-8 flex flex-col items-center justify-center w-full min-h-[200px]">
                    <div className="w-10 h-10 border border-white/10 bg-white/5 flex items-center justify-center mb-4">
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white/40"><path d="M12 20V4M12 4L5 11M12 4L19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div className="font-headline font-black text-xl tracking-tighter text-white uppercase mb-2">DROP PDF HERE</div>
                    <div className="font-mono uppercase tracking-[0.2em] text-[8px] text-white/40">OR CLICK TO BROWSE &middot; PDF ONLY</div>
                  </div>
                  <div className="mt-4 w-full border-l-2 border-white pl-4 py-2">
                    <p className="font-mono uppercase tracking-[0.2em] text-[8px] text-white/40 leading-relaxed">
                      PARSED USING AI &middot; EXTRACTS DATA IN SECONDS
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={false}
              animate={{ 
                opacity: step === 2 ? 1 : 0, 
                x: step === 2 ? 0 : (step < 2 ? 20 : -20),
                pointerEvents: step === 2 ? "auto" : "none"
              }}
              transition={{ duration: 0.5 }}
              className="col-start-1 row-start-1 flex flex-col gap-4 md:gap-6 p-4 md:p-8"
            >
              {/* Step 2: Profile Review Layout */}
              <div className="flex flex-col items-start justify-center shrink-0">
                <h1 className="font-headline font-black text-6xl leading-[0.8] tracking-tighter text-white m-0 p-0">02</h1>
                <h2 className="font-headline font-black uppercase text-4xl leading-[0.85] tracking-tighter text-white mt-4">
                  THIS<br />YOU?
                </h2>
              </div>
              
              <div className="flex flex-col gap-4 w-full mt-4 pb-4">
                
                {/* FULL NAME */}
                <div className="w-full">
                  <label className="block font-headline font-bold uppercase tracking-widest text-[9px] text-white/60 mb-1">
                    FULL NAME
                  </label>
                  <div className="w-full bg-white/[0.02] border border-white/20 text-white font-body text-xs px-3 h-10 flex items-center">
                    Ronit Mahajan
                  </div>
                </div>
                
                {/* COLLEGE & YEAR Grid */}
                <div className="w-full grid grid-cols-2 gap-3">
                  <div className="w-full">
                    <label className="block font-headline font-bold uppercase tracking-widest text-[9px] text-white/60 mb-1">
                      COLLEGE
                    </label>
                    <div className="w-full bg-white/[0.02] border border-white/20 text-white font-body text-xs px-3 h-10 flex items-center">
                      MUJ
                    </div>
                  </div>
                  <div className="w-full">
                    <label className="block font-headline font-bold uppercase tracking-widest text-[9px] text-white/60 mb-1">
                      YEAR OF STUDY
                    </label>
                    <div className="w-full bg-white/[0.02] border border-white/20 text-white font-body text-xs px-3 h-10 flex items-center">
                      2026
                    </div>
                  </div>
                </div>

                {/* SKILLS */}
                <div className="w-full mt-1">
                  <label className="block font-headline font-bold uppercase tracking-widest text-[9px] text-white/60 mb-2">
                    SKILLS
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["React", "Next.js", "TypeScript"].map((skill) => (
                      <div key={skill} className="border border-white/20 bg-white/[0.02] text-white font-mono text-[8px] uppercase tracking-[0.2em] px-2 py-1">
                        {skill}
                      </div>
                    ))}
                    <div className="border border-dashed border-white/20 text-white/30 font-mono text-[8px] uppercase tracking-[0.2em] px-2 py-1">
                      + ADD SKILL
                    </div>
                  </div>
                </div>

                {/* BUTTON */}
                <div className="mt-6 w-full relative">
                  <PrimaryButton 
                    title="Save Profile" 
                    subtitle="Continue" 
                    onClick={() => {}}
                    className="w-full !py-2 !px-4"
                  />
                </div>

              </div>
            </motion.div>

            <motion.div 
              initial={false}
              animate={{ 
                opacity: step === 3 ? 1 : 0, 
                x: step === 3 ? 0 : 20,
                pointerEvents: step === 3 ? "auto" : "none"
              }}
              transition={{ duration: 0.5 }}
              className="col-start-1 row-start-1 flex flex-col gap-4 md:gap-6 p-4 md:p-8"
            >
              {/* Step 3: Exact Dashboard Layout */}
              <div className="flex flex-col w-full h-full">
                {/* Hero Greeting */}
                <div className="mb-6 w-full">
                  <h1 className="font-headline font-black uppercase text-5xl leading-[0.85] tracking-tighter text-white">
                    GOOD MORNING,<br/>RONIT.
                  </h1>
                  <div className="font-mono uppercase tracking-[0.2em] text-[9px] text-white/40 mt-4 flex items-start">
                    YOUR NEXT REPLY STARTS HERE.
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="mb-8 flex gap-3 w-full">
                  <PrimaryButton 
                    title="New Cold Mail"
                    subtitle="Personalise"
                    variant="flat"
                    size="sm"
                    onClick={() => {}}
                    className="w-full !py-2 !px-2"
                  />
                  <PrimaryButton 
                    title="Follow Up Mail"
                    subtitle="Stay Persistent"
                    variant="flat"
                    size="sm"
                    onClick={() => {}}
                    className="w-full !py-2 !px-2 border-white/10"
                  />
                </div>

                {/* Mail History */}
                <div className="w-full flex flex-col flex-1">
                  <h2 className="font-headline uppercase tracking-widest text-[9px] font-bold text-white/60 mb-3">
                    MAIL HISTORY
                  </h2>
                  
                  <div className="flex flex-col gap-2">
                    <div className="border border-white/20 bg-white/[0.02] px-3 py-3 flex flex-col hover:border-white/40 transition-colors">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-headline font-black uppercase text-xs tracking-tighter text-white">
                          GOOGLE &mdash; SWE INTERN
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono uppercase tracking-[0.2em] text-[8px] text-white/30">MAY 11</span>
                          <span className="font-mono uppercase tracking-[0.2em] text-[8px] text-white/40 border border-white/10 px-1.5 py-0.5">PROFESSIONAL</span>
                        </div>
                      </div>
                    </div> 

                  
                    <div className="border border-white/5 bg-white/[0.01] px-3 py-3 flex flex-col opacity-50">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-headline font-black uppercase text-xs tracking-tighter text-white">
                          MICROSOFT &mdash; SDE INTERN
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono uppercase tracking-[0.2em] text-[8px] text-white/30">MAY 11</span>
                          <span className="font-mono uppercase tracking-[0.2em] text-[8px] text-white/40 border border-white/10 px-1.5 py-0.5">PROFESSIONAL</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-white/5 bg-white/[0.01] px-3 py-3 flex flex-col opacity-50">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-headline font-black uppercase text-xs tracking-tighter text-white">
                          APPLE &mdash; FRONTEND
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono uppercase tracking-[0.2em] text-[8px] text-white/30">MAY 10</span>
                          <span className="font-mono uppercase tracking-[0.2em] text-[8px] text-white/40 border border-white/10 px-1.5 py-0.5">AGGRESSIVE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            
            </motion.div>

            <motion.div 
              initial={false}
              animate={{ 
                opacity: step === 4 ? 1 : 0, 
                x: step === 4 ? 0 : 20,
                pointerEvents: step === 4 ? "auto" : "none"
              }}
              transition={{ duration: 0.5 }}
              className="col-start-1 row-start-1 flex flex-col gap-3 md:gap-4 p-4 md:p-8"
            >
              {/* Step 4: Compact Exact Compose Layout */}
              <div className="flex flex-col w-full h-full justify-between pb-2">
                <div className="group inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.2em] text-[9px] text-white/40 w-fit">
                  <span>←</span>
                  BACK TO DASHBOARD
                </div>

                <div className="w-full">
                  <label className="block font-headline font-bold uppercase tracking-widest text-[9px] text-white/60 mb-1">
                    RECIPIENT NAME
                  </label>
                  <div className="w-full bg-white/[0.02] border border-white/20 text-white/50 font-body text-xs px-3 py-2 flex items-center">
                    Ronit Mahajan
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-3">
                  <div className="w-full">
                    <label className="block font-headline font-bold uppercase tracking-widest text-[9px] text-white/60 mb-1">
                      COMPANY
                    </label>
                    <div className="w-full bg-white/[0.02] border border-white/20 text-white/50 font-body text-xs px-3 py-2 flex items-center">
                      Google
                    </div>
                  </div>
                  <div className="w-full">
                    <label className="block font-headline font-bold uppercase tracking-widest text-[9px] text-white/60 mb-1">
                      ROLE
                    </label>
                    <div className="w-full bg-white/[0.02] border border-white/20 text-white/50 font-body text-xs px-3 py-2 flex items-center">
                      SWE Intern
                    </div>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-3">
                  <div className="w-full">
                    <label className="block font-headline font-bold uppercase tracking-widest text-[9px] text-white/60 mb-1">
                      POSITION TYPE
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-white text-black font-mono text-[8px] uppercase tracking-[0.2em] px-1 py-2 text-center truncate">INTERNSHIP</div>
                      <div className="border border-white/10 text-white/40 font-mono text-[8px] uppercase tracking-[0.2em] px-1 py-2 text-center truncate">FULL TIME</div>
                    </div>
                  </div>
                  <div className="w-full">
                    <label className="block font-headline font-bold uppercase tracking-widest text-[9px] text-white/60 mb-1">
                      MAIL TYPE
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-white text-black font-mono text-[8px] uppercase tracking-[0.2em] px-1 py-2 text-center truncate">FRESH MAIL</div>
                      <div className="border border-white/10 text-white/40 font-mono text-[8px] uppercase tracking-[0.2em] px-1 py-2 text-center truncate">FOLLOW-UP</div>
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <label className="block font-headline font-bold uppercase tracking-widest text-[9px] text-white/60 mb-1">
                    TONE
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="bg-white text-black font-mono text-[8px] uppercase tracking-[0.2em] py-2 text-center truncate">PROFESSIONAL</div>
                    <div className="border border-white/10 text-white/40 font-mono text-[8px] uppercase tracking-[0.2em] py-2 text-center truncate">CASUAL</div>
                    <div className="border border-white/10 text-white/40 font-mono text-[8px] uppercase tracking-[0.2em] py-2 text-center truncate">BOLD</div>
                    <div className="border border-white/10 text-white/40 font-mono text-[8px] uppercase tracking-[0.2em] py-2 text-center truncate">CONCISE</div>
                  </div>
                </div>

                <div className="w-full">
                  <label className="block font-headline font-bold uppercase tracking-widest text-[9px] text-white/60 mb-1">
                    EXTRA CONTEXT
                  </label>
                  <div className="w-full bg-white/[0.02] border border-white/10 text-white/30 font-body text-xs px-3 py-2 h-12 flex items-start truncate">
                    Met at the MLH hackathon...
                  </div>
                </div>

                <div className="w-full pt-2 relative">
                  <PrimaryButton 
                    title="Generate Now" 
                    subtitle="Craft Your Cold Mail" 
                    onClick={() => {}}
                    className="w-full !py-2 !px-4"
                  />
                </div>

              </div>
            </motion.div>

          </div>
        </motion.div>
        </div>

      </div>
    </section>
  );
}
