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

          <span className="font-display text-sm font-semibold">
            FarmPulse
          </span>
        </Link>

        <h1 className="font-display text-2xl font-semibold">
          Terms of Service
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
          These terms describe the general conditions for using FarmPulse.
          Please review them carefully before using the service.
        </div>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="font-display text-base font-semibold">
              1. Using FarmPulse
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              FarmPulse provides agricultural information and tools designed
              to help users better understand their farming conditions,
              including weather, soil, crop suitability, pest risks, and
              market information. Information provided through the service is
              intended for general informational and planning purposes.
              By creating an account, you agree to these terms and confirm
              that you are able to enter into a legally binding agreement.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              2. Your account
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              You are responsible for keeping your account credentials secure
              and for activity associated with your account. If you believe
              your account has been accessed without authorization, please
              contact us at{" "}
              <a
                href="mailto:support@farmpulse.name.ng"
                className="text-primary underline"
              >
                support@farmpulse.name.ng
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              3. Information accuracy
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Information available through FarmPulse may come from external
              sources, calculations, and other datasets and is provided on an
              "as is" basis. We make reasonable efforts to provide useful and
              relevant information, but we do not guarantee that all
              information will always be complete, current, or accurate.
              FarmPulse should not be the sole basis for decisions involving
              significant financial, agricultural, health, or safety
              consequences.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              4. Acceptable use
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              You agree not to misuse FarmPulse, interfere with its operation,
              attempt to gain unauthorized access, collect information through
              automated methods at an unreasonable scale, or use the service
              for unlawful purposes. We may restrict or suspend access when
              necessary to protect the service and its users.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              5. Service availability
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              We aim to keep FarmPulse available and reliable, but some
              features may occasionally be unavailable because of maintenance,
              technical issues, network conditions, or circumstances outside
              our control.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              6. Changes to the service and terms
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              FarmPulse may evolve over time, and features or functionality
              may be added, changed, or removed. We may also update these
              terms when necessary. Material changes will be reflected by the
              "Last updated" date shown above.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              7. Contact
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Questions about these terms can be sent to{" "}
              <a
                href="mailto:support@farmpulse.name.ng"
                className="text-primary underline"
              >
                support@farmpulse.name.ng
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}