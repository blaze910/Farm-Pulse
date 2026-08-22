"use client";

import DashboardPage from "@/components/farm/DashboardPage";
import { RequireAuth } from "@/components/farm/RequireAuth";
import { AlertsOptIn } from "@/components/farm/AlertsOptIn";
import { SubscribeReminder } from "@/components/farm/SubscribeReminder";
import { SiteFooter } from "@/components/farm/SiteFooter";

export default function Page() {
  return (
    <RequireAuth>
      <DashboardPage />
      <AlertsOptIn />
      <SubscribeReminder />
      <SiteFooter />
    </RequireAuth>
  );
}
