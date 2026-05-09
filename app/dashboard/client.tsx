"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { gsap, useGSAP } from "@/lib/gsap";
import BrandHeader from "@/components/ui/BrandHeader";
import TextRollover from "@/components/TextRollover";
import Link from "next/link";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Chip from "@/components/ui/Chip";
import Preloader from "@/components/ui/Preloader";
import { getGreeting } from "@/lib/greeting";

// Types
type Profile = {
  name: string;
  college: string;
  year: string;
  github: string;
  linkedin: string;
  skills: string[];
  projects: string[];
};

type MailHistory = {
  id: string;
  recipient: string;
  company: string;
  role: string;
  tone: string;
  mail_type: string;
  position_type: string;
  word_limit: number;
  extra_context: string | null;
  subject: string;
  body: string;
  created_at: string;
};

export default function DashboardClient({ 
  initialUser, 
  initialProfile, 
  initialMailHistory 
}: { 
  initialUser: any; 
  initialProfile: Profile | null; 
  initialMailHistory: MailHistory[];
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [mailHistory, setMailHistory] = useState<MailHistory[]>(initialMailHistory);
  const [expandedMails, setExpandedMails] = useState<Set<string>>(new Set());
  const [toggleWord, setToggleWord] = useState(false);
  const [isPageAnimationFinished, setIsPageAnimationFinished] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const [imgError, setImgError] = useState(false);

  // Derived State
  const greetingParts = greeting.split(", ");
  const phrase = greetingParts[0];
  const nameWithDot = greetingParts[1];

  useEffect(() => {
    if (!isPageAnimationFinished) return;
    const interval = setInterval(() => {
      setToggleWord(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPageAnimationFinished]);

  useEffect(() => {
    const pName = profile?.name;
    const mName = typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user?.user_metadata?.name;
    const fName = typeof mName === "string"
      ? mName
      : user?.email?.split("@")[0];
    
    setGreeting(getGreeting(pName || fName || null));
  }, [profile, user]);


  useGSAP(() => {
    if (isLoading || !containerRef.current || !greeting) return;

    const tl = gsap.timeline({ 
      defaults: { ease: "power4.out" },
      onComplete: () => setIsPageAnimationFinished(true)
    });

    tl.fromTo(".greeting-char", {
      y: 100,
      opacity: 0,
      rotateX: -90,
      transformOrigin: "bottom center",
    }, {
      y: 0,
      opacity: 1,
      rotateX: 0,
      duration: 1.2,
      stagger: 0.05,
    })
    .fromTo(
      ".anim-sub",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      "-=0.6"
    )
    .fromTo(
      ['.anim-cta', '.anim-stats', '.anim-grid'],
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
      "-=0.6"
    );
  }, { dependencies: [isLoading, greeting], scope: containerRef });

  const toggleExpand = (id: string) => {
    setExpandedMails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleResend = (mail: MailHistory) => {
    const params = new URLSearchParams({
      recipient: mail.recipient || "",
      company: mail.company || "",
      role: mail.role || "",
      positionType: mail.position_type || "internship",
      mailType: mail.mail_type || "fresh",
      tone: mail.tone || "professional",
      wordLimit: String(mail.word_limit || 120),
    });
    router.push(`/compose?${params.toString()}`);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('mail_history')
      .delete()
      .eq('id', deleteConfirmId);

    if (error) {
      console.error("Error deleting mail:", error);
      alert("FAILED TO DELETE MAIL. PLEASE TRY AGAIN.");
    } else {
      setMailHistory(prev => prev.filter(mail => mail.id !== deleteConfirmId));
    }
    
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return <Preloader message="SYNCING" />;
  }

  return (
    <div ref={containerRef} className="min-h-screen-stable bg-black text-white pb-24">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 pt-6 md:pt-8 pb-4 flex items-center justify-between">
        <BrandHeader />
        <div className="flex items-center gap-4 relative">
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group px-2 sm:px-3 py-1.5 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 select-none"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            {(user?.user_metadata?.avatar_url && !imgError) ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-7 h-7 rounded-full object-cover border border-white/10"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="font-mono text-[10px] text-white/40">
                  {(profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex flex-col items-start hidden sm:block">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/40 group-hover:text-white transition-colors truncate max-w-[120px]">
                {profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0]}
              </span>
            </div>
            <svg 
              className={`w-3 h-3 text-white/20 transition-transform duration-300 ${showProfileDropdown ? 'rotate-180' : ''}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute top-full right-0 mt-4 w-[calc(100vw-2rem)] md:w-72 bg-[#0A0A0A] border border-white/10 p-6 z-[100] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 select-none">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <span className="font-headline font-black uppercase text-xl tracking-tighter text-white">
                    {profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || "Anonymous User"}
                  </span>
                  <div className="flex flex-col font-mono uppercase tracking-[0.2em] text-[9px] text-white/40 leading-relaxed">
                    {profile?.college ? (
                      <>
                        <span>{profile.college}</span>
                        {profile.year && <span>{profile.year}</span>}
                      </>
                    ) : (
                      <span>{user?.email}</span>
                    )}
                  </div>
                </div>

                {profile && (
                  <>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-headline uppercase tracking-widest text-[9px] font-bold text-on-surface-variant">SOCIALS</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.github && (
                          <a href={toAbsoluteUrl(profile.github)} target="_blank" rel="noreferrer" className="block hover:opacity-80 transition-opacity">
                            <Chip label="GITHUB" size="sm" className="border-white/5 text-white/30" />
                          </a>
                        )}
                        {profile.linkedin && (
                          <a href={toAbsoluteUrl(profile.linkedin)} target="_blank" rel="noreferrer" className="block hover:opacity-80 transition-opacity">
                            <Chip label="LINKEDIN" size="sm" className="border-white/5 text-white/30" />
                          </a>
                        )}
                      </div>
                    </div>

                    {profile.skills && profile.skills.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h3 className="font-headline uppercase tracking-widest text-[9px] font-bold text-on-surface-variant">SKILLS</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill, i) => (
                            <Chip key={i} label={skill} size="sm" className="border-white/5 text-white/30" />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
                  <button
                    onClick={() => { router.push("/profile/edit"); setShowProfileDropdown(false); }}
                    className="w-full text-left font-headline uppercase tracking-widest text-[13px] font-bold text-on-surface-variant hover:text-white transition-colors flex items-center justify-between group"
                  >
                    <span>EDIT PROFILE</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left font-headline uppercase tracking-widest text-[13px] font-bold text-on-surface-variant hover:text-red-500 transition-colors flex items-center justify-between group"
                  >
                    <span>LOG OUT</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-12 pt-32 md:pt-40">
        
        {/* Hero Greeting */}
        <div key={greeting} className="anim-greeting mb-10 overflow-visible">
          <h1 className="font-headline font-black uppercase text-[clamp(2.2rem,6.5vw,7.5rem)] leading-[0.85] tracking-tighter text-white pr-4 py-2 text-left overflow-visible">
            {/* Phrase Line */}
            <div className="block overflow-visible">
              {phrase.split(" ").map((word, wordIdx, arr) => (
                <span key={`p-${wordIdx}`} className="inline-block whitespace-nowrap mr-[0.25em] overflow-visible">
                  {word.split("").map((char, i) => (
                    <span key={`p-${wordIdx}-${i}`} className="greeting-char inline-block opacity-0">
                      {char}
                    </span>
                  ))}
                  {wordIdx === arr.length - 1 && nameWithDot && (
                    <span className="greeting-char inline-block opacity-0">,</span>
                  )}
                </span>
              ))}
            </div>
            
            {/* Name Line */}
            {nameWithDot && (
              <div className="block overflow-visible">
                {nameWithDot.split(" ").map((word, wordIdx) => (
                  <span key={`n-${wordIdx}`} className="inline-block whitespace-nowrap mr-[0.25em] overflow-visible">
                    {word.split("").map((char, i) => (
                      <span key={`n-${wordIdx}-${i}`} className="greeting-char inline-block opacity-0">
                        {char}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            )}
          </h1>
          <div className="anim-sub font-mono uppercase tracking-[0.2em] text-[13px] md:text-[15px] text-white/40 mt-4 opacity-0 flex items-center justify-center text-center">
            YOUR NEXT REPLY STARTS&nbsp;
            <TextRollover 
              text="HERE." 
              cloneText="NOW." 
              trigger={toggleWord}
              className="font-bold text-white"
              duration={0.6}
            />
          </div>
        </div>

        {/* Primary CTA */}
        <div className="anim-cta mb-12 flex flex-wrap gap-4 md:gap-6 justify-center opacity-0">
          <PrimaryButton 
            title="New Cold Mail"
            subtitle="Personalise"
            variant="flat"
            size="sm"
            onClick={() => router.push("/compose")}
            className="w-full md:w-auto"
          />
          <PrimaryButton 
            title="Follow Up Mail"
            subtitle="Stay Persistent"
            variant="flat"
            size="sm"
            onClick={() => router.push("/compose?type=followup")}
            className="w-full md:w-auto border border-white/10"
          />
        </div>

        {/* Main Grid */}
        <div className="anim-grid w-full opacity-0">
          
          {/* Mail History */}
          <div className="w-full flex flex-col">
            <h2 className="font-headline uppercase tracking-widest text-lg font-bold text-on-surface-variant mb-6">
              MAIL HISTORY
            </h2>
            
            <div className="flex flex-col gap-3">
              {mailHistory.length === 0 ? (
                <div className="border border-dashed border-white/10 p-16 flex flex-col items-center justify-center gap-4">
                  <span className="font-mono uppercase tracking-[0.2em] text-[10px] text-white/20">
                    NO MAILS YET. START CRAFTING.
                  </span>
                </div>
              ) : (
                mailHistory.map((mail) => {
                  const isExpanded = expandedMails.has(mail.id);
                  const dateStr = new Date(mail.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
                  
                  return (
                    <div key={mail.id} className="border border-white/5 flex flex-col hover:border-white/20 transition-colors duration-200">
                      {/* Row Header */}
                      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col gap-2">
                          <span className="font-headline font-black uppercase text-base tracking-tighter text-white">
                            {mail.company} &mdash; {mail.role}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono uppercase tracking-[0.2em] text-[10px] text-white/30">
                              {dateStr}
                            </span>
                            <span className="font-mono uppercase tracking-[0.2em] text-[10px] text-white/40 border border-white/10 px-2 py-0.5">
                              {mail.tone}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6">
                          <button 
                            onClick={() => toggleExpand(mail.id)}
                            className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors"
                          >
                            {isExpanded ? 'CLOSE' : 'VIEW'}
                          </button>
                          <button 
                            onClick={() => handleDelete(mail.id)}
                            className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-red-500 transition-colors"
                          >
                            DELETE
                          </button>
                          <button 
                            onClick={() => handleResend(mail)}
                            className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white transition-colors"
                          >
                            RESEND
                          </button>
                        </div>
                      </div>

                      {/* Expanded View */}
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                        <div className="px-6 pb-6 pt-2 border-t border-white/5 mt-2 mx-6">
                          <p className="font-mono text-xs text-white/50 mb-4 tracking-widest uppercase">
                            SUBJECT: {mail.subject}
                          </p>
                          <div className="font-body text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                            {mail.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[#0A0A0A] border border-white/10 p-8 max-w-md w-full flex flex-col gap-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col gap-2 text-center">
              <h3 className="font-headline font-black uppercase text-2xl tracking-tighter text-white">
                CONFIRM DELETION
              </h3>
              <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-white/40 leading-loose">
                ARE YOU SURE YOU WANT TO DELETE THIS MAIL?<br/>
                THIS ACTION CANNOT BE UNDONE.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                className="w-full bg-white text-black font-headline font-bold uppercase tracking-widest text-xs py-4 hover:bg-red-500 hover:text-white transition-colors"
              >
                DELETE PERMANENTLY
              </button>
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="w-full border border-white/10 text-white font-headline font-bold uppercase tracking-widest text-xs py-4 hover:bg-white/5 transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



/** Ensures a URL has a protocol so it's treated as absolute, not a relative path. */
function toAbsoluteUrl(url: string): string {
  if (!url) return "#";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}
