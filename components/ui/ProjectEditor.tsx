"use client";

import FormLabel from "./FormLabel";
import FormInput from "./FormInput";

export type ProjectEntry = {
  name: string;
  description: string;
  tech: string;
  link: string;
};

interface ProjectEditorProps {
  label: string;
  projects: ProjectEntry[];
  onChange: (projects: ProjectEntry[]) => void;
  /** Animation class for GSAP targeting */
  animClass?: string;
}

export default function ProjectEditor({
  label,
  projects,
  onChange,
  animClass,
}: ProjectEditorProps) {
  const handleUpdate = (index: number, field: keyof ProjectEntry, value: string) => {
    const newProjects = [...projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    onChange(newProjects);
  };

  const handleRemove = (index: number) => {
    onChange(projects.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (projects.length >= 5) return;
    onChange([...projects, { name: "", description: "", tech: "", link: "" }]);
  };

  return (
    <div
      className={`w-full ${animClass || ""}`}
      style={animClass ? { transformStyle: "preserve-3d" } : undefined}
    >
      <FormLabel rightText={`${projects.length} / 5`} className="mb-2">
        {label}
      </FormLabel>

      <div className="flex flex-col gap-4">
        {projects.map((project, i) => (
          <div key={i} className="border border-white/10 bg-white/[0.01] p-4 group">
            <div className="flex justify-between items-end mb-4">
              <span className="block font-headline font-bold uppercase tracking-widest text-[11px] md:text-xs text-on-surface-variant">
                PROJECT {i + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="font-mono text-[9px] md:text-[10px] text-white/30 hover:text-red-400 uppercase tracking-[0.15em] transition-colors duration-200"
              >
                [ REMOVE ]
              </button>
            </div>

            <div className="space-y-4">
              <FormInput
                label="PROJECT NAME"
                value={project.name}
                onChange={(val) => handleUpdate(i, "name", val)}
                placeholder="e.g. ColdCraft"
              />

              <div>
                <FormLabel>DESCRIPTION (1 SENTENCE)</FormLabel>
                <textarea
                  value={project.description}
                  onChange={(e) => handleUpdate(i, "description", e.target.value)}
                  placeholder="e.g. AI-powered cold email generator for job seekers."
                  rows={2}
                  className="w-full bg-white/[0.02] border border-white/20 focus:border-white/40 text-white font-body text-sm md:text-base px-4 py-2.5 md:py-3 rounded-none focus:outline-none transition-colors duration-200 placeholder:text-white/20 resize-none"
                />
              </div>

              <FormInput
                label="TECH STACK"
                value={project.tech}
                onChange={(val) => handleUpdate(i, "tech", val)}
                placeholder="e.g. Next.js, Supabase, Groq"
              />

              <FormInput
                label="PROJECT LINK (LIVE DEMO)"
                value={project.link}
                onChange={(val) => handleUpdate(i, "link", val)}
                placeholder="e.g. myproject.vercel.app"
              />
            </div>
          </div>
        ))}
      </div>

      {projects.length < 5 && (
        <button
          type="button"
          onClick={handleAdd}
          className="mt-4 w-full border border-dashed border-white/20 text-white/30 font-mono text-[11px] md:text-xs uppercase tracking-[0.2em] px-4 py-3 rounded-none hover:border-white/40 hover:text-white transition-colors duration-200"
        >
          + ADD PROJECT
        </button>
      )}
    </div>
  );
}
