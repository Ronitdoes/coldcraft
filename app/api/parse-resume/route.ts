import { groq } from "@/lib/groq";
import { RESUME_PARSE_PROMPT } from "@/lib/prompts";
import {
  consumeRateLimit,
  MAX_RESUME_FILE_BYTES,
  MAX_RESUME_PAGES,
  MAX_RESUME_REQUEST_BYTES,
  MAX_RESUME_TEXT_CHARS,
  requireAllowedOrigin,
  sanitizeStringArray,
  trimText,
} from "@/lib/security";
import { createClient } from "@/utils/supabase/server";
import { extractText } from "unpdf";

type ParsedResume = {
  name: string;
  college: string;
  year: string;
  github: string;
  linkedin: string;
  portfolio: string;
  skills: string[];
  projects: string[];
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Please log in before uploading a resume." }, { status: 401 });
    }

    const originError = requireAllowedOrigin(req);
    if (originError) return originError;

    const rateLimitError = await consumeRateLimit(user.id, "parse-resume");
    if (rateLimitError) return rateLimitError;

    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_RESUME_REQUEST_BYTES) {
      return Response.json({ error: "Your resume is too large. Please upload a PDF under 5 MB." }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Please choose a PDF resume to upload." }, { status: 400 });
    }

    const fileError = validatePdfFile(file);
    if (fileError) return fileError;

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (!hasPdfMagicBytes(bytes)) {
      return Response.json({ error: "That file does not look like a valid PDF. Please upload a proper PDF resume." }, { status: 400 });
    }

    const { text: pages, totalPages } = await extractText(new Uint8Array(arrayBuffer.slice(0)));

    if (totalPages > MAX_RESUME_PAGES) {
      return Response.json({ error: "Your resume is too long. Please upload a PDF with 5 pages or fewer." }, { status: 400 });
    }

    const resumeText = pages.join("\n").trim();
    console.log(`[parse-resume] Extracted ${totalPages} pages and ${resumeText.length} characters`);

    if (resumeText.length < 20) {
      return Response.json({ error: "We could not read enough text from this resume. Please upload a clearer text-based PDF." }, { status: 400 });
    }

    if (resumeText.length > MAX_RESUME_TEXT_CHARS) {
      return Response.json({ error: "This resume has too much text to process. Please upload a shorter version." }, { status: 400 });
    }

    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: RESUME_PARSE_PROMPT },
          { role: "user", content: `Extract from this resume:\n\n${resumeText}` },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 429) {
        const retryAfter = (err as { headers?: { get?: (k: string) => string | null } }).headers?.get?.("retry-after");
        return Response.json(
          {
            error: "Our AI is handling too many requests right now. Please wait and try again.",
            retryAfter: retryAfter ? Number(retryAfter) : 30,
          },
          { status: 503 }
        );
      }

      console.error("Groq parse error:", err);
      return Response.json({ error: "We could not read your resume right now. Please try again." }, { status: 500 });
    }

    const parsed = parseResumeJson(completion.choices[0].message.content);
    if (!parsed) {
      return Response.json({ error: "We could not understand the resume details. Please try again." }, { status: 500 });
    }

    const { error: dbError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      name: parsed.name,
      college: parsed.college,
      year: parsed.year,
      github: parsed.github,
      linkedin: parsed.linkedin,
      portfolio: parsed.portfolio,
      skills: parsed.skills,
      projects: parsed.projects,
    });

    if (dbError) {
      console.error("DB error:", dbError);
      return Response.json({ error: "We could not save your profile details right now. Please try again." }, { status: 500 });
    }

    return Response.json({ success: true, data: parsed });
  } catch (err) {
    console.error("PDF extraction error:", err);
    return Response.json({ error: "We could not process your resume. Please try another PDF." }, { status: 500 });
  }
}

function validatePdfFile(file: File) {
  if (file.size > MAX_RESUME_FILE_BYTES) {
    return Response.json({ error: "Your resume is too large. Please upload a PDF under 5 MB." }, { status: 413 });
  }

  if (file.type !== "application/pdf") {
    return Response.json({ error: "Please upload your resume as a PDF file." }, { status: 400 });
  }

  return null;
}

function hasPdfMagicBytes(bytes: Uint8Array) {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function parseResumeJson(raw: string | null): ParsedResume | null {
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Record<string, unknown>;

    return {
      name: trimText(value.name, 120),
      college: trimText(value.college, 160),
      year: trimText(value.year, 80),
      github: trimText(value.github, 300),
      linkedin: trimText(value.linkedin, 300),
      portfolio: trimText(value.portfolio, 300),
      skills: sanitizeStringArray(value.skills, 8, 80),
      projects: sanitizeStringArray(value.projects, 5, 120),
    };
  } catch {
    return null;
  }
}
