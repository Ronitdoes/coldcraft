"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import FormInput from "@/components/ui/FormInput";
import FormLabel from "@/components/ui/FormLabel";
import ToggleGroup from "@/components/ui/ToggleGroup";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Preloader from "@/components/ui/Preloader";

export type Profile = {
  name?: string;
  college?: string;
  year?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  skills?: string[];
  projects?: string[];
};

type Screen = "empty" | "loading" | "generated";

const loadingTexts = [
  "CRAFTING YOUR SUBJECT LINE...",
  "WRITING YOUR OPENING...",
  "PERSONALIZING YOUR MAIL...",
  "ALMOST READY...",
];

const POSITION_OPTIONS = [
  { id: "internship", label: "INTERNSHIP" },
  { id: "full-time", label: "FULL TIME" },
];

const MAIL_TYPE_OPTIONS = [
  { id: "fresh", label: "FRESH MAIL" },
  { id: "follow-up", label: "FOLLOW-UP" },
];

const TONE_OPTIONS = [
  { id: "professional", label: "PROFESSIONAL", description: "Clear, direct, zero fluff" },
  { id: "casual", label: "CASUAL", description: "Conversational but competent" },
  { id: "bold", label: "BOLD", description: "Opens with a strong claim" },
  { id: "concise", label: "CONCISE", description: "Under 80 words, every word earns its place" },
];

const WORD_LIMIT_OPTIONS = [
  { id: "80", label: "80" },
  { id: "120", label: "120" },
  { id: "160", label: "160" },
];

export default function ComposeClient({ profile }: { profile: Profile | null }) {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);

  const [inputs, setInputs] = useState({
    recipient: searchParams.get("recipient") ?? "",
    company: searchParams.get("company") ?? "",
    role: searchParams.get("role") ?? "",
    positionType: searchParams.get("positionType") ?? "internship",
    mailType: searchParams.get("mailType") ?? "fresh",
    tone: searchParams.get("tone") ?? "professional",
    wordLimit: Number(searchParams.get("wordLimit")) || 120,
    extraContext: searchParams.get("extraContext") ?? "",
  });

  const [output, setOutput] = useState({ subject: "", body: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [screen, setScreen] = useState<Screen>("empty");

  const isIncompleteProfile = !profile || !profile.github || !profile.linkedin || !profile.projects || profile.projects.length < 2;

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      [".anim-left", ".anim-right"],
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power4.out",
      }
    );
  }, { scope: containerRef });

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingTextIndex(i => (i + 1) % loadingTexts.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading]);

  const [retryCountdown, setRetryCountdown] = useState(0);

  // Countdown timer for server-busy retry
  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-retry when countdown reaches 0
          doGenerate(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCountdown > 0]);

  const doGenerate = async (isRetry = false) => {
    if (!inputs.recipient || !inputs.company || !inputs.role) {
      setError("RECIPIENT, COMPANY, AND ROLE ARE REQUIRED.");
      return;
    }
    setError("");
    setRetryCountdown(0);
    setLoading(true);
    setScreen("loading");

    try {
      const res = await fetch("/api/generate-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();

      if (res.status === 503 && data.retryAfter && !isRetry) {
        // Server busy — start countdown for auto-retry
        setLoading(false);
        setScreen("empty");
        setRetryCountdown(Math.min(data.retryAfter, 60));
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "GENERATION FAILED. TRY AGAIN.");
        setScreen("empty");
        return;
      }
      setOutput({ subject: data.subject, body: data.body });
      setScreen("generated");
    } catch {
      setError("NETWORK ERROR. CHECK YOUR CONNECTION.");
      setScreen("empty");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => doGenerate(false);

  const handleCopy = async () => {
    const full = `Subject: ${output.subject}\n\n${output.body}`;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGmailOpen = () => {
    const url = `https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(output.subject)}&body=${encodeURIComponent(output.body)}`;
    window.open(url, "_blank");
  };

  const updateInput = <Key extends keyof typeof inputs>(key: Key, value: (typeof inputs)[Key]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div ref={containerRef} className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start pb-20">

      {/* LEFT COLUMN */}
      <div className="anim-left flex flex-col gap-6 w-full">
        <Link 
          href="/dashboard" 
          className="group inline-flex items-center gap-2 font-mono uppercase tracking-[0.2em] text-[10px] text-white/40 hover:text-white transition-colors mb-2 w-fit"
        >
          <span className="transition-transform group-hover:-translate-x-1 duration-300">←</span>
          BACK TO DASHBOARD
        </Link>
        {isIncompleteProfile && (
          <div className="border-l-2 border-white/20 pl-4 py-2 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-mono uppercase tracking-[0.2em] text-[9px] md:text-[10px] text-white/30">
              ⚠ YOUR PROFILE IS INCOMPLETE — MAILS MAY BE LESS PERSONALIZED
            </span>
            <Link href="/onboarding/profile" className="font-mono uppercase tracking-[0.2em] text-[9px] md:text-[10px] text-white hover:text-white/70 transition-colors sm:ml-4 whitespace-nowrap">
              EDIT PROFILE →
            </Link>
          </div>
        )}

        <FormInput
          label="RECIPIENT NAME"
          value={inputs.recipient}
          onChange={(v) => updateInput("recipient", v)}
          placeholder="e.g. Priya Sharma"
        />

        <FormInput
          label="COMPANY / STARTUP"
          value={inputs.company}
          onChange={(v) => updateInput("company", v)}
          placeholder="e.g. Razorpay, Notion, Zepto"
        />

        <FormInput
          label="ROLE APPLYING FOR"
          value={inputs.role}
          onChange={(v) => updateInput("role", v)}
          placeholder="e.g. Frontend Intern, SDE-1"
        />

        <ToggleGroup
          label="POSITION TYPE"
          options={POSITION_OPTIONS}
          value={inputs.positionType}
          onChange={(v) => updateInput("positionType", v)}
        />

        <div>
          <ToggleGroup
            label="MAIL TYPE"
            options={MAIL_TYPE_OPTIONS}
            value={inputs.mailType}
            onChange={(v) => updateInput("mailType", v)}
          />
          {inputs.mailType === "follow-up" && (
            <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-white/20 mt-2">
              KEEP IT UNDER 80 WORDS. REFERENCE YOUR LAST MAIL.
            </p>
          )}
        </div>

        <ToggleGroup
          label="TONE"
          options={TONE_OPTIONS}
          value={inputs.tone}
          onChange={(v) => updateInput("tone", v)}
          columns={2}
        />

        <ToggleGroup
          label="WORD LIMIT"
          options={WORD_LIMIT_OPTIONS}
          value={String(inputs.wordLimit)}
          onChange={(v) => updateInput("wordLimit", Number(v))}
        />

        <div>
          <FormLabel>EXTRA CONTEXT (OPTIONAL)</FormLabel>
          <div className="relative">
            <textarea
              rows={3}
              maxLength={200}
              placeholder="ANY PROJECT TO HIGHLIGHT, REFERRAL NAME, OR CONTEXT..."
              value={inputs.extraContext}
              onChange={e => updateInput('extraContext', e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 text-white font-body text-sm px-4 py-3 rounded-none focus:outline-none focus:border-white/40 transition-colors duration-200 placeholder:text-white/20 resize-none"
            />
            <span className="absolute bottom-2 right-2 font-mono text-[9px] text-white/20">
              {inputs.extraContext.length} / 200
            </span>
          </div>
        </div>

        {retryCountdown > 0 && (
          <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-amber-400/80 mt-3 animate-pulse">
            ⏳ SERVER BUSY — RETRYING IN {retryCountdown}s...
          </p>
        )}

        {error && retryCountdown === 0 && (
          <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-red-500/80 mt-3">
            {error}
          </p>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div className="anim-right flex flex-col w-full md:sticky md:top-10">
        {screen === "empty" && (
          <div className="border border-dashed border-white/10 p-12 min-h-[400px] flex flex-col items-center justify-center gap-6">
            <div className="w-full flex flex-col gap-3 max-w-[80%] mx-auto opacity-30">
              <div className="bg-white/5 h-2 w-4/5" />
              <div className="bg-white/5 h-2 w-3/5" />
              <div className="bg-white/5 h-2 w-4/5" />
              <div className="bg-white/5 h-2 w-2/5" />
              <div className="bg-white/5 h-2 w-3/5" />
            </div>
            <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-white/20">
              YOUR MAIL WILL APPEAR HERE
            </p>
          </div>
        )}

        {screen === "loading" && (
          <div className="border border-dashed border-white/10 p-12 min-h-[400px] flex flex-col items-center justify-center">
            <Preloader fullScreen={false} message={loadingTexts[loadingTextIndex]} />
          </div>
        )}

        {screen === "generated" && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-headline font-bold uppercase tracking-widest text-[11px] md:text-xs text-on-surface-variant mb-2">
                SUBJECT
              </p>
              <div className="border-t border-white/10 pt-4">
                <p className="font-headline font-black uppercase text-lg tracking-tighter text-white">
                  {output.subject}
                </p>
              </div>
            </div>

            <div>
              <p className="font-headline font-bold uppercase tracking-widest text-[11px] md:text-xs text-on-surface-variant mb-2">
                MAIL BODY
              </p>
              <div className="border-t border-white/10 pt-4">
                <p className="font-body text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                  {output.body}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5">
              <button
                onClick={handleCopy}
                className="font-mono uppercase tracking-[0.2em] text-[10px] border border-white/10 px-4 py-2 text-white/40 hover:border-white/40 hover:text-white transition-colors duration-200"
              >
                {copied ? "COPIED ✓" : "COPY"}
              </button>
              <button
                onClick={handleGmailOpen}
                className="font-mono uppercase tracking-[0.2em] text-[10px] border border-white/10 px-4 py-2 text-white/40 hover:border-white/40 hover:text-white transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 4.5v15c0 .85-.65 1.5-1.5 1.5H21V7.387l-9 6.463-9-6.463V21H1.5C.65 21 0 20.35 0 19.5v-15c0-.425.162-.8.431-1.068C.7 3.16 1.075 3 1.5 3H2l10 7.188L22 3h.5c.425 0 .8.162 1.068.432.27.268.432.643.432 1.068z" fill="currentColor" />
                </svg>
                OPEN IN GMAIL
              </button>
            </div>
          </div>
        )}

        <div className="w-full mt-8">
          <PrimaryButton
            title={loading ? "GENERATING..." : screen === "generated" ? "REGENERATE" : "GENERATE NOW"}
            subtitle={screen === "generated" ? "TRY A DIFFERENT VERSION" : "CRAFT YOUR COLD MAIL"}
            onClick={handleGenerate}
            loading={loading}
            disabled={!inputs.recipient || !inputs.company || !inputs.role}
            variant="flat"
            className="w-full"
          />
        </div>
      </div>

      {/* BACKGROUND BRANDING */}
      <div className="fixed right-0 top-0 bottom-0 pointer-events-none hidden md:flex items-center justify-end z-[-1]">
        <span className="font-headline font-black uppercase text-[15vh] leading-none tracking-tighter text-white/[0.08] rotate-270 whitespace-nowrap translate-x-[40%]">
          COLDCRAFT
        </span>
      </div>
    </div>
  );
}
