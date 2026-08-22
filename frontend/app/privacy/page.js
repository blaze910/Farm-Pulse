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

          <span className="font-display text-sm font-semibold">
            FarmPulse
          </span>
        </Link>

        <h1 className="font-display text-2xl font-semibold">
          Privacy Policy
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="font-display text-base font-semibold">
              Information we collect
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              We collect information you provide when creating and managing
              your FarmPulse account, such as your email address and optional
              profile information. We may also collect farm locations and
              other information you choose to save. If you use the location
              feature, your device may provide your current location to help
              personalize your experience.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              How we use your information
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              We use your information to provide FarmPulse services,
              personalize your dashboard, generate agricultural insights,
              maintain your account, and send important account-related
              messages such as verification codes, password-reset
              instructions, and security notifications.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              Cookies
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              FarmPulse uses essential cookies to keep you signed in, maintain
              secure sessions, and protect account actions. We do not use
              advertising cookies or sell your personal information for
              advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              Agricultural information
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              FarmPulse uses weather, soil, location, market, and other
              agricultural information to provide insights, recommendations,
              and alerts. Information may come from external data sources,
              FarmPulse calculations, or curated datasets, depending on the
              feature and location.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              Third-party services
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Some FarmPulse features rely on trusted third-party services to
              provide data, account services, email delivery, and secure
              storage. Information required to provide these features may be
              processed by these services in accordance with their respective
              privacy policies and terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              Profile photos
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              If you choose to add a profile photo, it is securely stored and
              used as part of your FarmPulse account experience.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              Alerts and notifications
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              If you choose to receive FarmPulse alerts, we may send
              notifications related to changes or conditions affecting your
              saved locations, including agricultural risks, weather
              conditions, and other useful updates. You can manage your
              notification preferences from your account settings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              Your choices
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              You can update your account information, manage saved locations,
              and control available notification preferences from FarmPulse.
              You may also request deletion of your account and associated
              personal information, subject to applicable legal requirements.
            </p>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold">
              Contact
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              If you have questions about this Privacy Policy or how your
              information is handled, please contact the FarmPulse team
              through the contact information provided in the application.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}