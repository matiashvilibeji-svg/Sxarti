"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "@/components/admin/settings/general-settings";
import { TeamSettings } from "@/components/admin/settings/team-settings";
import { NotificationSettings } from "@/components/admin/settings/notification-settings";
import { SecuritySettings } from "@/components/admin/settings/security-settings";
import { createBrowserClient } from "@supabase/ssr";
import { AdminUser } from "@/types/admin";
import { Settings, Users, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setAdmins(data as AdminUser[]);
      });
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          Admin Settings
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Configure your workspace, security protocols, and team access.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4 hidden sm:block" />
            General
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4 hidden sm:block" />
            Team
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4 hidden sm:block" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4 hidden sm:block" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="team">
          <TeamSettings admins={admins} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
