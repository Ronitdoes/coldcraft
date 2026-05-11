"use client";

import Logo from "@/components/Logo";
import TextRollover from "@/components/TextRollover";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Footer() {
  const router = useRouter();
  const { user } = useAuth();

  const handleHeroLikeCTA = async () => {
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

  const handleShowcaseStep = (step: number) => {
    if ((window as any).setShowcaseStep) {
      (window as any).setShowcaseStep(step);
    } else {
      // Fallback scroll
      const el = document.getElementById("how-it-works");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const socialLinks = [
    { label: "GITHUB", href: "#" },
    { label: "LINKEDIN", href: "#" },
    { label: "TWITTER / X", href: "#" },
  ];

  return (
    <footer className="w-full px-8 md:px-12 py-16 md:py-24 flex flex-col md:flex-row justify-between items-start gap-8 bg-background text-on-background font-body text-xs tracking-widest uppercase relative z-20 border-t border-outline-variant overflow-hidden">
      <div className="flex flex-col gap-8 flex-1 max-w-sm">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8 text-on-background" />
          <div className="text-lg font-bold text-on-background font-headline">COLDCRAFT</div>
        </div>
        <p className="opacity-50 font-body uppercase leading-relaxed">
          An AI cold mail tool built for MUJ students by a MUJ student.
        </p>
        <div className="text-on-background">
          ©2026 COLDCRAFT. ALL RIGHTS RESERVED.
        </div>
      </div>
      <div className="flex flex-wrap gap-12 md:gap-24">
        <div className="flex flex-col gap-6">
          <span className="opacity-30 text-sm">Product</span>
          <a 
            className="text-on-surface-variant hover:text-on-background transition-colors text-lg font-headline font-bold cursor-pointer" 
            onClick={handleHeroLikeCTA}
          >
            <TextRollover text="How it works" />
          </a>
          <a 
            className="text-on-surface-variant hover:text-on-background transition-colors text-lg font-headline font-bold cursor-pointer" 
            onClick={() => handleShowcaseStep(1)}
          >
            <TextRollover text="Resume parser" />
          </a>
          <a 
            className="text-on-surface-variant hover:text-on-background transition-colors text-lg font-headline font-bold cursor-pointer" 
            onClick={() => handleShowcaseStep(4)}
          >
            <TextRollover text="Mail composer" />
          </a>
        </div>
        <div className="flex flex-col gap-6">
          <span className="opacity-30 text-sm">Social</span>
          {socialLinks.map(({ label, href }) => (
            <a
              key={label}
              className="group text-on-surface-variant hover:text-on-background transition-colors flex items-center gap-1 text-lg font-headline font-bold"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <TextRollover text={label} />
              <span className="material-symbols-outlined text-sm relative -rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                arrow_forward
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Massive Background Branding */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-screen overflow-hidden pointer-events-none select-none z-[-1] leading-none flex justify-center">
        <span className="font-headline font-black text-[22vw] text-white/[0.03] tracking-tighter block whitespace-nowrap -mb-[0.15em] translate-y-[10%] uppercase">
          COLDCRAFT
        </span>
      </div>
    </footer>
  );
}
