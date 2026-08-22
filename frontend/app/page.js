"use client";

import { useState } from "react";
import Link from "next/link";
import { Bug, CloudSun, LineChart, Sprout, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AuthForm } from "@/components/farm/AuthForm";
import { LiveReadoutCluster } from "@/components/farm/LiveReadoutCluster";
import { ThemeToggle } from "@/components/farm/ThemeToggle";
import { SiteFooter } from "@/components/farm/SiteFooter";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    tag: "SOIL",
    icon: Layers,
    title: "Soil profile intelligence",
    body: "pH, organic carbon, texture and drainage pulled per coordinate — no soil lab visit needed.",
  },
  {
    tag: "SKY",
    icon: CloudSun,
    title: "Live weather & rainfall",
    body: "Hourly conditions, 30-day rainfall history and a 7-day forecast for each zone you save.",
  },
  {
    tag: "SUITABILITY",
    icon: Sprout,
    title: "Crop suitability scoring",
    body: "FAO-style suitability scores that rank the best crops for the soil and weather you actually have.",
  },
  {
    tag: "PEST",
    icon: Bug,
    title: "Pest Prophet",
    body: "Weather-driven outbreak risk with the reasoning, confidence and the action to take this week.",
  },
  {
    tag: "MARKET",
    icon: LineChart,
    title: "Market board",
    body: "Track prices for your crops so harvest timing is a decision, not a guess.",
  },
];

export default function LandingPage() {
  const { session, loading } = useAuth();
  const [authMode, setAuthMode] = useState(null); // "signin" | "signup" | null

  return (
    <main className="relative min-h-screen overflow-hidden bg-background grain-field">
      <div className="relative mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="size-5" />
            </span>
            <span className="truncate font-display text-sm font-semibold">FarmPulse</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {loading ? (
              <div className="h-9 w-[148px] animate-pulse rounded-md bg-white/10" aria-hidden="true" />
            ) : session ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" onClick={() => setAuthMode("signup")}>
                  Sign up
                </Button>
              </>
            )}
          </div>
        </header>

        <section className="grid gap-10 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
              Field intelligence platform
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Know what your soil, sky and pests are doing — before you walk the field.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              FarmPulse turns free satellite, soil and weather data into one readable dashboard for
              every zone you farm: suitability scores, pest outbreak windows and market prices.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {loading ? (
                <div className="h-11 w-[200px] animate-pulse rounded-md bg-white/10" aria-hidden="true" />
              ) : session ? (
                <Button asChild size="lg">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={() => setAuthMode("signup")}>
                    Create free account
                  </Button>
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/login">I already have an account</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-border/60 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.5)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/farm-hero.jpg"
                alt="A FarmPulse member's own field, with grazing cattle and a farmhouse in the valley below"
                className="size-full object-cover"
              />
            </div>
            <div className="mt-4 flex justify-center lg:absolute lg:-bottom-8 lg:-left-10 lg:mt-0 lg:justify-start">
              <LiveReadoutCluster compact />
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-12">
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            What FarmPulse reads for every zone
          </p>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((f) => (
              <article key={f.title} className="bg-background/95 p-5 transition-colors hover:bg-white/[0.04]">
                <div className="flex items-center gap-2">
                  <f.icon className="size-4 text-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {f.tag}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-base font-semibold">{f.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-start justify-between gap-4 border-t border-white/10 py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold">Ready when you are</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign up in under a minute. Save a zone and the first snapshot loads instantly.
            </p>
          </div>
          {!loading && !session ? (
            <Button size="lg" onClick={() => setAuthMode("signup")} className="shrink-0">
              Get started
            </Button>
          ) : null}
        </section>

        <SiteFooter />
      </div>

      <Dialog open={authMode !== null} onOpenChange={(open) => setAuthMode(open ? authMode : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">
            {authMode === "signup" ? "Create your account" : "Sign in"}
          </DialogTitle>
          {authMode ? <AuthForm initialMode={authMode} /> : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
