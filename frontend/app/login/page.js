"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sprout } from "lucide-react";
import { AuthForm } from "@/components/farm/AuthForm";
import { LiveReadoutCluster } from "@/components/farm/LiveReadoutCluster";
import { useAuth } from "@/hooks/useAuth";

// Only allow same-app relative paths as a redirect target — never an
// absolute/external URL, so a crafted ?next= can't be used to bounce a
// signed-in user off-site.
function safeNext(raw) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading } = useAuth();
  const next = useMemo(() => safeNext(searchParams.get("next")), [searchParams]);

  useEffect(() => {
    if (!loading && session) router.replace(next);
  }, [loading, session, next, router]);

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Context pane — hidden on small screens so mobile goes straight to the form. */}
      <div className="relative hidden overflow-hidden border-r border-white/10 contour-field lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="size-5" />
          </span>
          <span className="font-display text-sm font-semibold">FarmPulse</span>
        </Link>

        <div className="max-w-sm">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
            Field intelligence platform
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight">
            Every saved zone, read like an instrument panel.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Soil, weather, suitability and pest risk — updated per zone, not per guess.
          </p>
        </div>

        <LiveReadoutCluster compact />
      </div>

      {/* Form pane */}
      <div className="grid place-items-center px-5 py-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="size-5" />
            </span>
            <span className="font-display text-sm font-semibold">FarmPulse</span>
          </Link>
          <div className="rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur-sm">
            <AuthForm onAuthenticated={() => router.replace(next)} />
          </div>
        </div>
      </div>
    </main>
  );
}

/** The single authentication page. Also reachable via the landing-page modal. */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-background" />}>
      <LoginPageContent />
    </Suspense>
  );
}
