"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { gsap, useGSAP } from "@/lib/gsap";
import dynamic from "next/dynamic";
import GetOverlaySVG from "@/components/GetOverlaySVG";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";

const EmailFlowAnimation = dynamic(() => import("@/components/EmailFlowAnimation"), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  const container = useRef<HTMLElement>(null);
  const router = useRouter();

  const { user } = useAuth();

  const handleCTA = async () => {
    if (user) {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profile) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding/resume");
      }
    } else {
      router.push("/login");
    }
  };

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(".hero-char", {
      y: 150,
      opacity: 0,
      rotateX: -90,
      transformOrigin: "bottom center",
    }, {
      y: 0,
      opacity: 1,
      rotateX: 0,
      duration: 1.5,
      stagger: 0.1,
    })
      .fromTo(".hero-line", { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.2, ease: "expo.inOut" }, "-=1.0")
      .fromTo(".hero-sub", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.2 }, "-=0.8")
      .to(".hero-arrow-path", { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut", stagger: 0.2 }, "+=0.4")
      .fromTo(".hero-arrow-text", { opacity: 1, clipPath: "inset(-20% 100% -20% -20%)", rotate: -12 }, { clipPath: "inset(-20% -20% -20% -20%)", duration: 1.2, ease: "power2.inOut" }, "-=0.3");
  }, { scope: container });

  return (
    <section 
      ref={container}
      className="min-h-screen-stable flex flex-col justify-center px-4 md:px-8 pb-8 md:pb-16 pt-32 md:pt-48 overflow-hidden bg-black perspective-[1000px] relative"
    >
      <EmailFlowAnimation />
      <div className="relative w-full text-center py-4 flex flex-col items-center justify-center pointer-events-none z-10">
        <h1 className="font-headline font-black text-[clamp(7rem,21vw,35rem)] kerning-tight text-primary select-none pointer-events-none relative mb-0 inline-block w-full leading-[0.80]">
          <span className="flex justify-center overflow-visible relative">
            <GetOverlaySVG />
            {"HIRED".split("").map((char, i) => (
              <span key={i} className="hero-char inline-block opacity-0 will-change-transform" style={{ transformStyle: "preserve-3d" }}>{char}</span>
            ))}
          </span>
          <div className="absolute bottom-[0.06em] left-1/2 -translate-x-1/2 bg-primary/40 h-[1px] w-[80vw] md:w-[40vw] max-w-3xl z-[-1] hero-line transform-origin-left opacity-0 scale-x-0 will-change-transform" />
        </h1>
        <div className="flex flex-col items-center w-full">
          <div className="grid grid-cols-12 w-full text-left mt-12 mb-12 hero-sub opacity-0 translate-y-[30px] will-change-transform">
            <div className="col-span-12 md:col-span-4 min-h-[120px]">
              <p className="font-body text-sm leading-relaxed opacity-60 uppercase tracking-[0.2em] font-bold">
                STOP GETTING IGNORED.<br />
                YOUR NEXT INTERNSHIP OR JOB<br />
                STARTS WITH ONE EMAIL.
              </p>
              <p className="font-mono text-[10px] leading-relaxed opacity-30 uppercase tracking-[0.2em] mt-6 md:mt-8">
                Built in MUJ · For MUJ students
              </p>
            </div>
            <div className="hidden md:block col-span-4" />
          </div>
          <div className="flex flex-col items-center gap-4 md:gap-6 mt-8 md:-mt-12 relative z-20 hero-sub opacity-0 translate-y-[30px] pointer-events-auto will-change-transform">
            {/* Hand-drawn Arrow */}
            <div className="absolute left-1/2 top-1/2 hidden md:block pointer-events-none opacity-80 z-[-1] translate-x-[11.25rem] lg:translate-x-[13rem] -translate-y-[85%]">
              <span className="hero-arrow-text absolute bottom-[40%] left-[10%] lg:left-[10%] text-white text-xl lg:text-3xl tracking-widest font-bold opacity-0 whitespace-nowrap" style={{ fontFamily: '"Caveat", "Comic Sans MS", cursive', filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
                it&apos;s free!
              </span>
              <svg className="w-[20rem] h-[16rem] lg:w-[28rem] lg:h-[22rem]" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className="hero-arrow-path" style={{ strokeDasharray: 600, strokeDashoffset: 600 }} d="M 320 60 C 220 70, 150 280, 15 280" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path className="hero-arrow-path" style={{ strokeDasharray: 100, strokeDashoffset: 100 }} d="M 35 265 L 15 280 L 35 295" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <PrimaryButton 
              title="Write my cold mail" 
              subtitle="Internship / Full-time" 
              onClick={handleCTA}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
