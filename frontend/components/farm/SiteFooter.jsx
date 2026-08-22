import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 py-8 text-xs text-muted-foreground">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} FarmPulse. All rights reserved.</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <a href="mailto:support@farmpulse.name.ng" className="hover:text-foreground">
            Contact support
          </a>
        </nav>
      </div>
    </footer>
  );
}
