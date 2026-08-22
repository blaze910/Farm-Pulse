import Link from "next/link";
import { Sprout } from "lucide-react";

export const metadata = { title: "Privacy Policy — FarmPulse" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background grain-field px-5 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="size-5" />
          </span>
          <span className="font-display text-sm font-semibold">FarmPulse</span>
        </Link>

        <h1 className="font-display text-2xl font-semibold">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
          This is a standard starting-point template, not legal advice. Have it reviewed by a lawyer familiar with your jurisdiction (and any data-protection laws that apply to your users) before relying on it.
        </div>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="font-display text-base font-semibold">What we collect</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Account details you provide (email, optional display name), farm zone locations you save, and — if you use "Use my
              location" — the coordinates your browser reports. If you sign in with Google, we receive your Google account email
              and name. If you upload a profile photo, it's stored via Supabase Storage.
            </p>
          </section>
          <section>
            <h2 className="font-display text-base font-semibold">How we use it</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              To run the dashboard (fetching weather/soil/pest data for your saved zones), to authenticate you (session cookies),
              and to send account-related email (verification codes, password resets, email-change confirmations) via Resend.
            </p>
          </section>
          <section>
            <h2 className="font-display text-base font-semibold">Cookies</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We use httpOnly session cookies to keep you signed in and a CSRF cookie to protect account actions. We don't use
              advertising or tracking cookies.
            </p>
          </section>
          <section>
            <h2 className="font-display text-base font-semibold">Third parties</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Weather/soil/geocoding data comes from Open-Meteo, SoilGrids (ISRIC), and OpenStreetMap/Nominatim — your zone
              coordinates are sent to these services to fetch data, per their own terms. Email delivery is handled by Resend.
              File storage and the database are hosted on Supabase.
            </p>
          </section>
          <section>
            <h2 className="font-display text-base font-semibold">Your choices</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You can update or delete your saved zones and profile info from Settings, or delete your account entirely, which
              removes your data from our database.
            </p>
          </section>
          <section>
            <h2 className="font-display text-base font-semibold">Contact</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Questions about this policy or your data: <a href="mailto:support@farmpulse.name.ng" className="text-primary underline">support@farmpulse.name.ng</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
