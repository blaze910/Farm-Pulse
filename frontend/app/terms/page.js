import Link from "next/link";
import { Sprout } from "lucide-react";

export const metadata = { title: "Terms of Service — FarmPulse" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background grain-field px-5 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="size-5" />
          </span>
          <span className="font-display text-sm font-semibold">FarmPulse</span>
        </Link>

        <h1 className="font-display text-2xl font-semibold">Terms of Service</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
          This is a standard starting-point template, not legal advice. Have it reviewed by a lawyer familiar with your jurisdiction before relying on it.
        </div>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="font-display text-base font-semibold">1. Using FarmPulse</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              FarmPulse provides weather, soil, crop-suitability, pest-risk, and market data for informational purposes.
              By creating an account, you agree to these terms. You must be able to form a legally binding contract to use the service.
            </p>
          </section>
          <section>
            <h2 className="font-display text-base font-semibold">2. Your account</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You're responsible for keeping your login credentials secure and for all activity under your account.
              Let us know at <a href="mailto:support@farmpulse.name.ng" className="text-primary underline">support@farmpulse.name.ng</a> if you suspect unauthorized access.
            </p>
          </section>
          <section>
            <h2 className="font-display text-base font-semibold">3. Data accuracy</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Weather, soil, and pest-risk data come from third-party sources (including Open-Meteo and SoilGrids) and are provided "as is."
              FarmPulse does not guarantee accuracy and isn't liable for decisions made based on this data. Always use your own judgment for
              farming decisions with real financial or safety consequences.
            </p>
          </section>
          <section>
            <h2 className="font-display text-base font-semibold">4. Acceptable use</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Don't attempt to disrupt the service, scrape it at scale, or use it for anything illegal. We may suspend accounts that violate this.
            </p>
          </section>
          <section>
            <h2 className="font-display text-base font-semibold">5. Changes</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We may update these terms as the product evolves. Material changes will be reflected by the "last updated" date above.
            </p>
          </section>
          <section>
            <h2 className="font-display text-base font-semibold">6. Contact</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Questions about these terms: <a href="mailto:support@farmpulse.name.ng" className="text-primary underline">support@farmpulse.name.ng</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
