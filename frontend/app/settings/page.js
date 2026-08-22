"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Camera, Loader2, LogOut, Mail, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AppSidebar, MobileTopNav } from "@/components/farm/AppSidebar";
import { PasswordInput } from "@/components/farm/PasswordInput";
import { CardShell } from "@/components/farm/CardShell";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiFetch, apiPost } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/lib/app-data";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, session, profile, loading } = useAuth();
  
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username ?? "");
    setDisplayName(profile.display_name ?? "");
    setAvatarUrl(profile.avatar_url ?? null);
  }, [profile]);

  async function saveProfile() {
    setBusy("profile");
    try {
      await updateProfile.mutateAsync({
        username: username.trim() || null,
        display_name: displayName.trim() || null,
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setBusy(null);
    }
  }

  async function uploadAvatar(file) {
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setBusy("avatar");
    try {
      const form = new FormData();
      form.append("file", file);
      const json = await apiFetch("/accounts/profile/avatar/", { method: "POST", body: form });
      setAvatarUrl(json.data.avatarUrl || null);
      toast.success("Photo updated");
    } catch (err) { toast.error(err.message || "Upload failed"); } finally { setBusy(null); }
  }

  async function changeEmail() {
    const parsed = z.string().trim().email().max(255).safeParse(newEmail);
    if (!parsed.success) { toast.error("Enter a valid email address"); return; }
    setBusy("email");
    // Nothing changes on the account yet at this point — the backend now
    // requires clicking a confirmation link sent to the new address before
    // it actually takes effect, so the toast needs to say that instead of
    // implying it's already done.
    try {
      const json = await apiPost("/accounts/profile/email/", { email: parsed.data });
      toast.success(json?.message || `Check ${parsed.data} for a confirmation link.`);
      setNewEmail("");
    } catch (err) { toast.error(err.message || "Could not change email"); } finally { setBusy(null); }
  }

  async function changePassword() {
    const parsed = z.string().min(8, "Use at least 8 characters").max(72).safeParse(newPassword);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy("password");
    try { await apiPost("/accounts/profile/password/", { password: parsed.data }); setNewPassword(""); toast.success("Password changed"); }
    catch (err) { toast.error(err.message || "Could not change password"); } finally { setBusy(null); }
  }

  async function signOut() {
    await queryClient.cancelQueries(); queryClient.clear();
    try { await apiPost("/accounts/logout/", {}); } finally { router.replace("/login"); }
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account data and all saved zones? This cannot be undone.")) return;
    setBusy("delete");
    try { await apiPost("/accounts/delete/", {}); toast.success("Account deleted"); router.replace("/login"); }
    catch (err) { toast.error(err.message || "Could not delete account"); } finally { setBusy(null); }
  }

  if (!loading && !session) return null;

  const initials = (displayName || username || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background grain-field">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <MobileTopNav />
        <header className="border-b border-border/70 px-5 py-5 md:px-8">
          <h1 className="font-display text-xl font-semibold tracking-tight">Account settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </header>

        <main className="grid max-w-4xl gap-4 px-5 py-6 md:px-8 lg:grid-cols-2">
          <CardShell title="Profile" subtitle="Photo and name" icon={<User className="size-4" />}>
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Your profile photo"
                    className="aspect-square size-20 rounded-full border border-border/70 object-cover object-center"
                  />
                ) : (
                  <span className="grid aspect-square size-20 place-items-center rounded-full bg-primary/20 font-mono text-lg text-primary">
                    {initials}
                  </span>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
                  aria-label="Upload profile photo"
                >
                  {busy === "avatar" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Camera className="size-3.5" />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadAvatar(f);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                For the best result, use a clear square profile photo.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="dn">Display name</Label>
                <Input id="dn" value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="un">Username</Label>
                <Input id="un" value={username} maxLength={40} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <Button onClick={saveProfile} disabled={busy === "profile"} className="w-full">
                {busy === "profile" ? <Loader2 className="size-4 animate-spin" /> : null} Save profile
              </Button>
            </div>
          </CardShell>

          <div className="space-y-4">
            <CardShell title="Change Email address" subtitle="Verified at both addresses" icon={<Mail className="size-4" />}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ne">New email</Label>
                  <Input
                    id="ne"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@farm.co"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  A confirmation link goes to your new address and a notice to the old one. The change
                  only applies once the new address confirms.
                </p>
                <Button variant="secondary" onClick={changeEmail} disabled={busy === "email"} className="w-full">
                  {busy === "email" ? <Loader2 className="size-4 animate-spin" /> : null} Send verification
                </Button>
              </div>
            </CardShell>

            <CardShell title="Change Password" subtitle="Checked against known breaches" icon={<ShieldCheck className="size-4" />}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pw">New password</Label>
                  <PasswordInput
                    id="pw"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={setNewPassword}
                  />
                </div>
                <Button variant="secondary" onClick={changePassword} disabled={busy === "password"} className="w-full">
                  {busy === "password" ? <Loader2 className="size-4 animate-spin" /> : null} Change password
                </Button>
              </div>
            </CardShell>
          </div>

          <CardShell title="Alerts" subtitle="Email opt-in" icon={<Mail className="size-4" />}>
            <ToggleRow
              label="Pest risk alerts"
              hint="Emailed when a tracked zone crosses into high risk"
              checked={profile?.pest_alerts ?? true}
              onChange={(v) => updateProfile.mutate({ pest_alerts: v })}
            />
            <ToggleRow
              label="Weekly digest"
              hint="Past-data research recap every Monday"
              checked={profile?.weekly_digest ?? false}
              onChange={(v) => updateProfile.mutate({ weekly_digest: v })}
            />
          </CardShell>

          <CardShell
            title="Danger zone"
            subtitle="Irreversible actions"
            icon={<AlertTriangle className="size-4" />}
            className="border-risk-high/40"
          >
            <div className="space-y-3">
              <Button variant="secondary" onClick={signOut} className="w-full">
                <LogOut className="size-4" /> Sign out
              </Button>
              <Button variant="destructive" onClick={deleteAccount} disabled={busy === "delete"} className="w-full">
                {busy === "delete" ? <Loader2 className="size-4 animate-spin" /> : null} Delete account
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Deletion removes your profile, saved zones and notifications immediately.
              </p>
            </div>
          </CardShell>
        </main>
      </div>
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-3 last:border-0">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
