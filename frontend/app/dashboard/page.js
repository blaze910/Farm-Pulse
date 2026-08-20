"use client";

import DashboardPage from "@/components/farm/DashboardPage";
import { RequireAuth } from "@/components/farm/RequireAuth";
import { AlertsOptIn } from "@/components/farm/AlertsOptIn";
import { SubscribeReminder } from "@/components/farm/SubscribeReminder";

export default function Page() {
  return (
    <RequireAuth>
      <DashboardPage />
      <AlertsOptIn />
      <SubscribeReminder />
    </RequireAuth>
  );
}
