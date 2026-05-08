"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import BrandHeader from "@/components/ui/BrandHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { createClient } from "@/utils/supabase/client";

const GoogleIcon = () => (
  <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [supabase] = useState(() => createClient());

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      ".auth-title-char",
      { y: 150, opacity: 0, rotateX: -90, transformOrigin: "bottom center" },
      { y: 0, opacity: 1, rotateX: 0, duration: 1.2, stagger: 0.05, delay: 0.2 }
    )
      .fromTo(
        ".auth-subtitle",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 },
        "-=0.6"
      )
      .fromTo(
        ".auth-btn-wrapper",
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.5)", clearProps: "transform" },
        "-=0.6"
      );
  }, { scope: containerRef });

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error logging in:", error.message);
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden perspective-[1000px] px-4">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent pointer-events-none z-0" />

      {/* Top Logo */}
      <div className="absolute top-8 left-8 z-20">
        <BrandHeader />
      </div>

      <div className="flex flex-col items-center w-full max-w-4xl z-10 text-center">
        <h1 className="font-headline font-black text-[18vw] md:text-[9vw] leading-[0.8] tracking-tighter text-primary select-none mb-6 text-center w-full pt-20 md:pt-0">
          <div className="flex flex-wrap md:flex-nowrap justify-center overflow-visible md:whitespace-nowrap gap-x-4">
            {["NO", "MORE", "GHOSTING"].map((word, wordIdx) => (
              <span key={`word-${wordIdx}`} className="flex whitespace-nowrap">
                {word.split("").map((char, i) => (
                  <span key={`${word}-${i}`} className="auth-title-char inline-block opacity-0" style={{ transformStyle: "preserve-3d" }}>
                    {char}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </h1>

        {/* Subtitle */}
        <div className="auth-subtitle opacity-0 translate-y-8 flex flex-col items-center mt-8 md:mt-12 mb-12">
          <p className="font-body text-xs md:text-base leading-relaxed opacity-60 uppercase tracking-[0.2em] font-bold px-4">
            STOP GETTING IGNORED.
            <br />
            90 SECONDS TO YOUR FIRST COLD MAIL
          </p>
        </div>

        <div className="auth-btn-wrapper opacity-0">
          <PrimaryButton
            title={isLoading ? "AUTHENTICATING" : "Continue with Google"}
            subtitle="Secure & fast login"
            icon={!isLoading ? <GoogleIcon /> : undefined}
            loading={isLoading}
            loadingSubtitle="Please wait..."
            onClick={handleGoogleLogin}
          />
        </div>
      </div>
    </div>
  );
}
