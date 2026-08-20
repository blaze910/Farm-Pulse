"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Client-side route guard.
 * The Django session check (`GET /api/v1/accounts/profile/`, via useAuth) is the
 * single authority: no profile means no session, so we send the visitor to /login.
 *
 * Mirrors Django's own login_required/LoginView `?next=` pattern: the page the
 * visitor was actually trying to reach is preserved in the query string so
 * /login can send them back there after signing in, instead of always
 * dropping them on /dashboard.
 */
export function RequireAuth({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      const next = pathname && pathname !== "/dashboard" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return children;
}
