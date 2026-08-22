"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ChevronLeft,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Settings,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/farm/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
import {
  useMarkNotificationsRead,
  useNotifications,
  useProfile,
  useUpdateProfile,
} from "@/lib/app-data";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/settings", label: "Settings", icon: Settings },
];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function initials(name) {
  return (
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "?"
  );
}

export function AppSidebar({ variant = "desktop", onNavigate }) {
  const drawer = variant === "drawer";
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: notifications } = useNotifications(user?.id);
  const markRead = useMarkNotificationsRead(user?.id);
  const updateProfile = useUpdateProfile();
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => { setAvatarUrl(profile?.avatar_url || null); }, [profile?.avatar_url]);

  const list = notifications ?? [];
  const unread = list.filter((n) => !n.read).length;
  const name = profile?.display_name || profile?.username || user?.email || "Guest";

  async function signOut() {
    // Clear every cached query (profile, zones, notifications, snapshots…)
    // *before* navigating away. Without this, react-query's in-memory cache
    // survives the client-side route change, so the next account signed
    // into on this device could briefly render the previous user's data.
    await queryClient.cancelQueries();
    queryClient.clear();
    try {
      await apiPost("/accounts/logout/", {});
    } catch {
      // Even if the network call fails, we still want to send the visitor
      // to /login rather than leaving them on a page that thinks they're
      // signed in — the cleared cache above already dropped any local
      // trace of their session.
    } finally {
      router.push("/login");
    }
  }

  const width = drawer ? "w-full" : collapsed ? "w-[72px]" : "w-64";

  return (
    <aside
      className={cn(
        // h-dvh (dynamic viewport height), not h-screen (100vh): 100vh is
        // calculated against the LARGEST possible viewport (mobile browser
        // chrome collapsed), which is taller than what's actually visible
        // when the address bar is showing. Content pinned to the bottom of
        // an oversized h-screen box — like the logout button below — ends
        // up positioned below the real visible area, hidden behind the
        // browser's own UI, with nothing technically overflowing for
        // overflow-y-auto to let you scroll to. dvh tracks the real
        // visible viewport as the browser chrome shows/hides, which is
        // the actual fix, not just adding more overflow handling.
        "flex h-dvh shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-sidebar-border bg-sidebar",
        drawer ? "w-full" : "sticky top-0 hidden md:flex transition-[width] duration-300 ease-out",
        width,
      )}
    >
      <div className="flex items-center gap-2.5 px-4 py-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Sprout className="size-5" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-sidebar-foreground">
              FarmPulse
            </p>
            <p className="truncate text-[11px] text-muted-foreground">Zone intelligence</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              href={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={cn("size-[18px] shrink-0", active && "text-sidebar-primary")}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && active && (
                <span className="ml-auto h-4 w-1 rounded-full bg-sidebar-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 px-3 pb-4">
        <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
          <Popover
            onOpenChange={(open) => {
              if (open && unread > 0) markRead.mutate();
            }}
          >
            <PopoverTrigger asChild>
              <button className="relative flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground">
                <Bell className="size-[18px] shrink-0" />
                {!collapsed && <span>Alerts</span>}
                {unread > 0 && (
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full bg-primary font-mono text-[10px] text-primary-foreground",
                      collapsed ? "absolute right-2 top-1.5 size-4" : "ml-auto",
                    )}
                  >
                    {unread}
                  </span>
                )}
              </button>
            </PopoverTrigger>
          <PopoverContent
            side={drawer ? "bottom" : "right"}
            align={drawer ? "start" : "end"}
            collisionPadding={16}
            className="w-[min(20rem,calc(100vw-2rem))] p-0"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-display text-sm font-semibold">Notifications</p>
              <span className="text-[11px] text-muted-foreground">{unread} new</span>
            </div>
            <ul className="max-h-72 divide-y divide-border overflow-y-auto">
              {list.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-muted-foreground">
                  {user
                    ? "No alerts yet. Pest and price alerts land here."
                    : "Sign in to receive zone alerts."}
                </li>
              )}
              {list.map((n) => (
                <li key={n.id} className="flex gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      n.read ? "bg-border" : "bg-primary",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
              <div>
                <p className="text-xs font-medium">Email digests</p>
                <p className="text-[11px] text-muted-foreground">Weekly research recap</p>
              </div>
              <Switch
                disabled={!user}
                checked={profile?.weekly_digest ?? false}
                onCheckedChange={(v) => updateProfile.mutate({ weekly_digest: v })}
              />
            </div>
          </PopoverContent>
        </Popover>
          <ThemeToggle />
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-2.5 transition-colors hover:bg-sidebar-accent"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/20 font-mono text-xs text-primary">
                  {initials(name)}
                </span>
              )}
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-sidebar-foreground">
                    {name}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {user.email}
                  </span>
                </span>
              )}
            </Link>
            {!collapsed && (
              <button
                onClick={signOut}
                title="Sign out"
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-sidebar-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="size-4" />
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground"
          >
            <LogOut className="size-4 rotate-180" />
            {!collapsed && "Sign in"}
          </Link>
        )}

        <button
          hidden={drawer}
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className={cn("size-3.5 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}

export function MobileTopNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    // aria-hidden on a container that still holds DOM focus (e.g. the close
    // button, right after clicking it) is invalid and trips a console
    // warning — inert both hides it from assistive tech AND forcibly drops
    // focus, so blur first to be safe across browsers.
    if (!open && typeof document.activeElement?.blur === "function") {
      document.activeElement.blur();
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-sidebar/95 px-3 py-2.5 backdrop-blur md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="grid size-9 place-items-center rounded-xl border border-sidebar-border text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <Menu className="size-[18px]" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="size-4" />
          </span>
          <span className="truncate font-display text-sm font-semibold">FarmPulse</span>
        </div>
        <span className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] capitalize text-muted-foreground">
            {nav.find((n) => n.to === pathname)?.label ?? ""}
          </span>
          <ThemeToggle className="size-8" />
        </span>
      </div>
      {/* Since the bar above is `fixed` (removed from normal document flow
          so it never scrolls away), this spacer reserves the same height
          in-flow so page content doesn't render underneath it. Height
          matches the bar's actual rendered height (py-2.5 padding + the
          9-unit/36px button, ~52px total) plus its 1px border. */}
      <div className="h-[53px] md:hidden" aria-hidden="true" />

      {/* Slide-in drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        inert={!open}
      >
    
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute right-2 top-3 z-10 grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
          <AppSidebar variant="drawer" onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
