"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  email: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Client-side auth hook. Returns current user, email, loading state, and signOut function.
 * Listens for auth state changes automatically.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data?.user) {
        setUser(null);
        // Force clear stale local session if server rejects it
        if (error) {
          supabase.auth.signOut().catch(() => {});
        }
      } else {
        setUser(data.user);
      }
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setUser(null);
    }
  };

  return {
    user,
    email: user?.email ?? null,
    isLoading,
    signOut,
  };
}
