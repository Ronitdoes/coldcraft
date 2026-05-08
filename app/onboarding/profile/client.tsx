"use client";

import { useRef, useState, useEffect } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import BrandHeader from "@/components/ui/BrandHeader";
import StepIndicator from "@/components/ui/StepIndicator";
import FormInput from "@/components/ui/FormInput";
import ChipGroup from "@/components/ui/ChipGroup";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function ProfileReviewPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [userEmail, setUserEmail] = useState("loading...");
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    college: "",
    year: "",
    github: "",
    linkedin: "",
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Fetch logged in user and their profile
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || "NO EMAIL FOUND");
        setUserId(user.id);

        // Fetch newly parsed profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.name || prev.name,
            college: profile.college || prev.college,
            year: profile.year || prev.year,
            github: profile.github || prev.github,
            linkedin: profile.linkedin || prev.linkedin,
          }));
          if (profile.skills && Array.isArray(profile.skills)) {
            setSkills(profile.skills);
          }
          if (profile.projects && Array.isArray(profile.projects)) {
            setProjects(profile.projects);
          }
        }
      } else {
        setUserEmail("NOT AUTHENTICATED");
      }
      setIsLoading(false);
    });
  }, [supabase]);

  useGSAP(() => {
    if (isLoading || !containerRef.current) return;

    gsap.fromTo(
      ['.anim-number', '.anim-heading', '.anim-fields', '.anim-chips', '.anim-cta'],
      { rotateX: -90, opacity: 0, y: 30, transformOrigin: 'bottom center' },
      { rotateX: 0, opacity: 1, y: 0, duration: 1.2, stagger: 0.08, ease: 'power4.out' }
    );
  }, { scope: containerRef, dependencies: [isLoading] });

  const handleSave = async () => {
    if (!userId) {
      alert("No authenticated user found. In a real app, this would redirect to login.");
      return;
    }
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: formData.name,
        email: userEmail,
        college: formData.college,
        year: formData.year,
        github: formData.github,
        linkedin: formData.linkedin,
        skills,
        projects,
        onboarding_completed: true
      });

    if (error) {
      console.error(error);
      alert("Failed to save profile. Make sure the 'profiles' table exists in Supabase.");
      setIsSaving(false);
      return;
    }

    router.push("/dashboard");
  };

  const updateField = (key: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const fieldCount = Object.values(formData).filter(v => typeof v === 'string' && v.trim() !== "").length 
    + 1 // Email
    + (skills.length > 0 ? 1 : 0)
    + (projects.length > 0 ? 1 : 0);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full bg-black overflow-x-hidden relative">
        <BrandHeader className="absolute top-8 left-8 z-20" />
        <div className="absolute top-24 md:top-10 left-1/2 -translate-x-1/2">
          <StepIndicator currentStep={2} totalSteps={2} label="REVIEW YOUR PROFILE" />
        </div>
        
        <div className="w-full max-w-6xl px-4 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center min-h-[100dvh] pt-32 pb-24 md:py-24 mx-auto">
          {/* Left Column Skeleton */}
          <div className="flex flex-col items-start justify-center pt-16 md:pt-0">
            <div className="w-32 h-32 md:w-48 md:h-48 bg-white/[0.03] animate-pulse mb-6" />
            <div className="w-full max-w-[280px] h-16 bg-white/[0.03] animate-pulse mb-2" />
            <div className="w-3/4 max-w-[200px] h-16 bg-white/[0.03] animate-pulse mb-6" />
            <div className="w-64 h-4 bg-white/[0.03] animate-pulse mb-12" />
            <div className="w-full max-w-md h-16 bg-white/[0.03] animate-pulse hidden md:block" />
          </div>

          {/* Right Column Skeleton */}
          <div className="flex flex-col items-start md:items-end w-full max-w-xl mx-auto justify-center">
            <div className="w-full flex flex-col gap-6">
              <div className="w-full h-16 bg-white/[0.03] animate-pulse" />
              <div className="w-full h-16 bg-white/[0.03] animate-pulse" />
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="h-16 bg-white/[0.03] animate-pulse" />
                <div className="h-16 bg-white/[0.03] animate-pulse" />
              </div>
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="h-16 bg-white/[0.03] animate-pulse" />
                <div className="h-16 bg-white/[0.03] animate-pulse" />
              </div>
              <div className="w-full h-20 bg-white/[0.03] animate-pulse" />
              <div className="w-full h-20 bg-white/[0.03] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-[100dvh] w-full bg-black overflow-hidden relative perspective-[1200px]">

      {/* Top Left Logo */}
      <BrandHeader className="absolute top-8 left-8 z-20" />

      {/* Step Indicator */}
      <div className="absolute top-24 md:top-10 left-1/2 -translate-x-1/2 z-20">
        <StepIndicator currentStep={2} totalSteps={2} label="REVIEW YOUR PROFILE" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto h-full grid grid-cols-1 md:grid-cols-2">

        {/* LEFT STATIC PANEL */}
        <div className="h-full flex-col items-start justify-center px-6 md:px-12 hidden md:flex relative">
          <div className="anim-number" style={{ transformStyle: 'preserve-3d' }}>
            <h1 className="font-headline font-black text-[clamp(6rem,16vw,16rem)] leading-[0.8] tracking-tighter text-white m-0 p-0 block select-none">
              02
            </h1>
          </div>

          <div className="anim-heading mt-2" style={{ transformStyle: 'preserve-3d' }}>
            <h2 className="font-headline font-black uppercase text-[clamp(2.5rem,5vw,5rem)] leading-[0.85] tracking-tighter text-white select-none">
              <span className="whitespace-nowrap">THIS</span><br />
              <span className="whitespace-nowrap">YOU?</span>
            </h2>
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-white/40 mt-6 select-none">
              WE FOUND {fieldCount} {" "} FIELDS &middot; REVIEW BEFORE CONTINUING
            </div>
          </div>

          {/* Save Button (Desktop) */}
          <div className="anim-cta w-full max-w-md mt-12" style={{ transformStyle: 'preserve-3d' }}>
            <PrimaryButton
              title={isSaving ? "Saving Profile..." : "Save & Continue"}
              subtitle="Proceed To Next Step"
              onClick={handleSave}
              disabled={isSaving}
              variant="flat"
              className="w-full !py-3 md:!py-4 !min-w-0"
            />
          </div>

          {/* Bottom Trust Line (Moved inside left panel for alignment) */}
          <div className="absolute bottom-12 left-6 md:left-12 font-mono uppercase tracking-[0.2em] text-[10px] text-white/20 whitespace-nowrap z-10 pointer-events-none">
            YOUR PROFILE IS SAVED AND REUSED FOR EVERY MAIL YOU GENERATE
          </div>
        </div>

        {/* RIGHT SCROLL PANEL */}
        <div data-lenis-prevent="true" className="h-full max-h-[100dvh] overflow-y-auto px-6 md:px-12 pt-32 md:pt-28 pb-12 flex flex-col items-start md:items-end w-full relative">
          <div className="w-full max-w-xl mx-auto md:mx-0 flex flex-col gap-4 relative z-10">
            
            {/* Mobile Hero (Only visible on mobile so they still see the title) */}
            <div className="md:hidden mb-8 mt-12">
              <h1 className="font-headline font-black text-6xl leading-[0.8] tracking-tighter text-white">02</h1>
              <h2 className="font-headline font-black uppercase text-4xl leading-[0.85] tracking-tighter text-white mt-2">THIS YOU?</h2>
            </div>

            <FormInput
              label="FULL NAME"
              value={formData.name}
              onChange={updateField("name")}
              animClass="anim-fields"
            />

            <FormInput
              label="EMAIL"
              value={userEmail}
              readOnly
              labelRightText="LOCKED &middot; FROM GOOGLE"
              animClass="anim-fields"
            />

            {/* College & Year Grid */}
            <div className="anim-fields w-full grid grid-cols-2 gap-4" style={{ transformStyle: 'preserve-3d' }}>
              <FormInput label="COLLEGE" value={formData.college} onChange={updateField("college")} />
              <FormInput label="YEAR OF STUDY" value={formData.year} onChange={updateField("year")} />
            </div>

            {/* GitHub & LinkedIn Grid */}
            <div className="anim-fields w-full grid grid-cols-2 gap-4" style={{ transformStyle: 'preserve-3d' }}>
              <FormInput label="GITHUB URL" value={formData.github} onChange={updateField("github")} />
              <FormInput label="LINKEDIN URL" value={formData.linkedin} onChange={updateField("linkedin")} />
            </div>

            <ChipGroup
              label="SKILLS"
              items={skills}
              onItemsChange={setSkills}
              addButtonText="+ ADD SKILL"
              animClass="anim-chips"
            />

            <ChipGroup
              label="KEY PROJECTS"
              items={projects}
              onItemsChange={setProjects}
              addButtonText="+ ADD PROJECT"
              animClass="anim-chips"
            />

            {/* Save Button (Mobile) */}
            <div className="anim-cta w-full mt-8 md:hidden" style={{ transformStyle: 'preserve-3d' }}>
              <PrimaryButton
                title={isSaving ? "Saving Profile..." : "Save & Continue"}
                subtitle="Proceed To Next Step"
                onClick={handleSave}
                disabled={isSaving}
                variant="flat"
                className="w-full !py-3 md:!py-4 !min-w-0"
              />
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
