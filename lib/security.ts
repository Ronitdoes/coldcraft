import { createAdminClient } from "@/utils/supabase/admin";

export const MAX_RESUME_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_RESUME_REQUEST_BYTES = MAX_RESUME_FILE_BYTES + 1024 * 1024;
export const MAX_RESUME_PAGES = 5;
export const MAX_RESUME_TEXT_CHARS = 20_000;

type RateLimitAction = "generate-mail" | "parse-resume";

const RATE_LIMITS: Record<RateLimitAction, number> = {
  "generate-mail": 20,
  "parse-resume": 5,
};

type RateLimitRow = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
};

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

export function getAllowedOrigins(req?: Request) {
  const origins = new Set<string>();

  const appOrigin = normalizeOrigin(process.env.APP_ORIGIN);
  if (appOrigin) origins.add(appOrigin);

  for (const entry of (process.env.ALLOWED_REDIRECT_ORIGINS ?? "").split(",")) {
    const origin = normalizeOrigin(entry);
    if (origin) origins.add(origin);
  }

  if (process.env.NODE_ENV !== "production" && req) {
    origins.add(new URL(req.url).origin);
  }

  return origins;
}

export function requireAllowedOrigin(req: Request) {
  const origin = normalizeOrigin(req.headers.get("origin"));

  if (!origin) {
    return null;
  }

  if (!getAllowedOrigins(req).has(origin)) {
    return Response.json(
      { error: "This request came from an untrusted page. Please refresh the app and try again." },
      { status: 403 }
    );
  }

  return null;
}

export function getSafeRedirectOrigin(req: Request) {
  const requestOrigin = new URL(req.url).origin;

  if (process.env.NODE_ENV !== "production") {
    return requestOrigin;
  }

  const allowedOrigins = getAllowedOrigins(req);
  if (allowedOrigins.has(requestOrigin)) {
    return requestOrigin;
  }

  const appOrigin = normalizeOrigin(process.env.APP_ORIGIN);
  return appOrigin ?? requestOrigin;
}

export async function consumeRateLimit(userId: string, action: RateLimitAction) {
  const limit = RATE_LIMITS[action];

  try {
    const { data, error } = await createAdminClient()
      .rpc("consume_rate_limit", {
        p_action: action,
        p_limit: limit,
        p_user_id: userId,
        p_window_seconds: 3600,
      })
      .single<RateLimitRow>();

    if (error) {
      console.error("Rate limit check failed:", error);
      return Response.json(
        { error: "We could not check your usage limit right now. Please try again in a moment." },
        { status: 500 }
      );
    }

    if (!data.allowed) {
      return Response.json(
        { error: "You have reached your hourly limit. Please try again later.", resetAt: data.reset_at },
        { status: 429 }
      );
    }
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return Response.json(
      { error: "We could not check your usage limit right now. Please try again in a moment." },
      { status: 500 }
    );
  }

  return null;
}

export function trimText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function sanitizeStringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => trimText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}
