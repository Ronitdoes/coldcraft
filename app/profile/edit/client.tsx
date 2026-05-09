"use client";

import { useRef, useState, useEffect } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import BrandHeader from "@/components/ui/BrandHeader";
import FormInput from "@/components/ui/FormInput";
import ChipGroup from "@/components/ui/ChipGroup";
import PrimaryButton from "@/components/ui/PrimaryButton";

const LOADING_TEXTS = [
  "READING YOUR RESUME...",
  "FINDING YOUR PROJECTS...",
  "EXTRACTING YOUR SKILLS...",
  "ALMOST DONE...",
];

export default function EditProfileClient() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userEmail, setUserEmail] = useState("loading...");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Resume upload states
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [parseError, setParseError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    college: "",
    year: "",
    github: "",
    linkedin: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);

  const [supabase] = useState(() => createClient());

  // Cycle loading text while uploading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUploading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_TEXTS.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  // Fetch existing profile on mount
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || "");
        setUserId(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setFormData({
            name: profile.name || "",
            college: profile.college || "",
            year: profile.year || "",
            github: profile.github || "",
            linkedin: profile.linkedin || "",
          });
          if (profile.skills && Array.isArray(profile.skills)) setSkills(profile.skills);
          if (profile.projects && Array.isArray(profile.projects)) setProjects(profile.projects);
        }
      }
      setIsLoading(false);
    });
  }, [supabase]);

  useGSAP(() => {
    if (isLoading || !containerRef.current) return;
    gsap.fromTo(
      [".anim-number", ".anim-heading", ".anim-upload", ".anim-fields", ".anim-chips", ".anim-cta"],
      { rotateX: -90, opacity: 0, y: 30, transformOrigin: "bottom center" },
      { rotateX: 0, opacity: 1, y: 0, duration: 1.2, stagger: 0.08, ease: "power4.out" }
    );
  }, { scope: containerRef, dependencies: [isLoading] });

  // --- Resume upload handlers ---
  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setParseError("PDF files only.");
      return;
    }
    setParseError("");
    setSelectedFile(file);
    setIsUploading(true);
    setLoadingStep(0);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
      const data = await res.json();

      if (res.ok && data.data) {
        const p = data.data;
        setFormData({
          name: p.name || formData.name,
          college: p.college || formData.college,
          year: p.year || formData.year,
          github: p.github || formData.github,
          linkedin: p.linkedin || formData.linkedin,
        });
        if (p.skills && Array.isArray(p.skills)) setSkills(p.skills);
        if (p.projects && Array.isArray(p.projects)) setProjects(p.projects);
      } else {
        setParseError(data.error || "Failed to parse resume. Try again.");
        setSelectedFile(null);
      }
    } catch {
      setParseError("Network error. Check your connection.");
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (!isUploading) setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isUploading && e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isUploading && e.target.files?.[0]) processFile(e.target.files[0]);
  };
  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setParseError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Save handler ---
  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    setSaveSuccess(false);

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      email: userEmail,
      name: formData.name,
      college: formData.college,
      year: formData.year,
      github: formData.github,
      linkedin: formData.linkedin,
      skills,
      projects,
      onboarding_completed: true,
    });

    setIsSaving(false);
    if (error) {
      console.error(error);
    } else {
      setSaveSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    }
  };

  const updateField = (key: keyof typeof formData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen-stable w-full bg-black overflow-x-hidden relative">
        <BrandHeader className="absolute top-8 left-8 z-20" />
        <div className="w-full max-w-6xl px-4 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center min-h-screen-stable pt-32 pb-24 md:py-24 mx-auto">
          <div className="flex flex-col items-start justify-center pt-16 md:pt-0">
            <div className="w-32 h-32 md:w-48 md:h-48 bg-white/[0.03] animate-pulse mb-6" />
            <div className="w-full max-w-[280px] h-16 bg-white/[0.03] animate-pulse mb-2" />
            <div className="w-3/4 max-w-[200px] h-16 bg-white/[0.03] animate-pulse mb-6" />
          </div>
          <div className="flex flex-col gap-4 w-full max-w-xl">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full h-16 bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen-stable w-full bg-black overflow-x-hidden relative perspective-[1200px] pb-24 md:pb-0">

      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 h-20 md:h-24 bg-black/60 backdrop-blur-md z-40 border-b border-white/5 flex items-center justify-between px-6 md:px-12">
        <BrandHeader href="/dashboard" />
        
        <button
          onClick={() => router.push("/dashboard")}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors"
        >
          ← BACK
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto h-full grid grid-cols-1 md:grid-cols-2">

        {/* LEFT STATIC PANEL */}
        <div className="h-full flex-col items-start justify-center px-6 md:px-12 hidden md:flex relative">
          <div className="anim-number" style={{ transformStyle: "preserve-3d" }}>
            <h1 className="font-headline font-black text-[clamp(4rem,16vw,16rem)] leading-[0.8] tracking-tighter text-white m-0 p-0 block select-none">
              EP
            </h1>
          </div>

          <div className="anim-heading mt-2" style={{ transformStyle: "preserve-3d" }}>
            <h2 className="font-headline font-black uppercase text-[clamp(2.5rem,5vw,5rem)] leading-[0.85] tracking-tighter text-white select-none">
              <span className="whitespace-nowrap">EDIT</span><br />
              <span className="whitespace-nowrap">PROFILE.</span>
            </h2>
            <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-white/40 mt-6 select-none">
              UPDATE YOUR INFO · UPLOAD A NEW RESUME TO REFRESH
            </div>
          </div>

          {/* Save Button (Desktop) */}
          <div className="anim-cta w-full max-w-md mt-12" style={{ transformStyle: "preserve-3d" }}>
            <PrimaryButton
              title={saveSuccess ? "Saved!" : isSaving ? "Saving..." : "Save Changes"}
              subtitle={saveSuccess ? "Redirecting to dashboard" : "Update Your Profile"}
              onClick={handleSave}
              disabled={isSaving || saveSuccess}
              variant="flat"
              className="w-full !py-3 md:!py-4 !min-w-0"
            />
          </div>

          <div className="absolute bottom-12 left-6 md:left-12 font-mono uppercase tracking-[0.2em] text-[10px] text-white/20 whitespace-nowrap z-10 pointer-events-none">
            YOUR PROFILE IS SAVED AND REUSED FOR EVERY MAIL YOU GENERATE
          </div>
        </div>

        {/* RIGHT SCROLL PANEL */}
        <div data-lenis-prevent="true" className="h-full max-h-screen-stable overflow-y-auto px-6 md:px-12 pt-24 md:pt-28 pb-12 flex flex-col items-start md:items-end w-full relative">
          <div className="w-full max-w-xl mx-auto md:mx-0 flex flex-col gap-4 relative z-10">

            {/* Mobile heading */}
            <div className="md:hidden mb-4 mt-8">
              <h1 className="font-headline font-black text-5xl leading-[0.8] tracking-tighter text-white">EP</h1>
              <h2 className="font-headline font-black uppercase text-4xl leading-[0.85] tracking-tighter text-white mt-2">EDIT PROFILE.</h2>
            </div>

            {/* ─── RESUME UPLOAD ZONE ─── */}
            <div className="anim-upload w-full flex flex-col gap-3" style={{ transformStyle: "preserve-3d" }}>
              <div className="font-mono uppercase tracking-[0.2em] text-[10px] text-white/40">
                UPLOAD NEW RESUME <span className="text-white/20">· OPTIONAL · FILLS FIELDS AUTOMATICALLY</span>
              </div>

              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed transition duration-300 rounded-none bg-white/[0.02] p-8 flex flex-col items-center justify-center min-h-[140px] relative
                  ${isUploading
                    ? "border-transparent cursor-default"
                    : selectedFile
                    ? "border-white/40 cursor-default"
                    : isDragging
                    ? "border-white cursor-pointer"
                    : "border-white/10 hover:border-white/40 cursor-pointer"
                  }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                />

                {isUploading ? (
                  <div className="flex flex-col items-center justify-center w-full select-none">
                    <div className="flex gap-3 mb-5">
                      {[0, 300, 600].map((d) => (
                        <div key={d} className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                    <div className="h-4 relative w-full flex justify-center items-center">
                      {LOADING_TEXTS.map((text, i) => (
                        <div
                          key={i}
                          className={`absolute font-mono uppercase tracking-[0.2em] text-[10px] text-white/60 transition-opacity duration-500 ${loadingStep === i ? "opacity-100" : "opacity-0"}`}
                        >
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="flex items-center gap-4 w-full px-2">
                    <div className="w-7 h-7 rounded-full border border-white flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="font-mono text-xs text-white truncate flex-1 text-left select-none">{selectedFile.name}</span>
                    <button onClick={clearFile} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center select-none gap-3">
                    <div className="w-8 h-8 border border-white/10 bg-white/5 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/40">
                        <path d="M12 20V4M12 4L5 11M12 4L19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="font-headline font-black text-xl tracking-tighter text-white uppercase">DROP PDF HERE</div>
                    <div className="font-mono uppercase tracking-[0.2em] text-[9px] text-white/30">OR CLICK TO BROWSE · PDF ONLY · MAX 5MB</div>
                  </div>
                )}
              </div>

              {parseError && (
                <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-red-400">{parseError}</p>
              )}

              {selectedFile && !isUploading && (
                <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-white/40">
                  ✓ FIELDS UPDATED FROM RESUME · REVIEW AND SAVE BELOW
                </p>
              )}

              {/* divider */}
              <div className="border-t border-white/5 mt-2" />
            </div>

            {/* ─── PROFILE FIELDS ─── */}
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
              labelRightText="LOCKED · FROM GOOGLE"
              animClass="anim-fields"
            />

            <div className="anim-fields w-full grid grid-cols-2 gap-4" style={{ transformStyle: "preserve-3d" }}>
              <FormInput label="COLLEGE" value={formData.college} onChange={updateField("college")} />
              <FormInput label="YEAR OF STUDY" value={formData.year} onChange={updateField("year")} />
            </div>

            <div className="anim-fields w-full grid grid-cols-2 gap-4" style={{ transformStyle: "preserve-3d" }}>
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
            <div className="anim-cta w-full mt-8 md:hidden" style={{ transformStyle: "preserve-3d" }}>
              <PrimaryButton
                title={saveSuccess ? "Saved!" : isSaving ? "Saving..." : "Save Changes"}
                subtitle={saveSuccess ? "Redirecting to dashboard" : "Update Your Profile"}
                onClick={handleSave}
                disabled={isSaving || saveSuccess}
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
