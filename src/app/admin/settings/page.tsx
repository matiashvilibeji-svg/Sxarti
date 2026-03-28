"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "@/components/admin/settings/general-settings";
import { TeamSettings } from "@/components/admin/settings/team-settings";
import { NotificationSettings } from "@/components/admin/settings/notification-settings";
import { SecuritySettings } from "@/components/admin/settings/security-settings";
import { WebSearchSettings } from "@/components/admin/settings/web-search-settings";
import { BusinessLimitsSettings } from "@/components/admin/settings/business-limits-settings";
import { createBrowserClient } from "@supabase/ssr";
import { AdminUser } from "@/types/admin";
import {
  Settings,
  Users,
  Bell,
  Shield,
  Globe,
  SlidersHorizontal,
} from "lucide-react";

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
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-6">
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
            <TabsTrigger value="web-search" className="flex items-center gap-2">
              <Globe className="h-4 w-4 hidden sm:block" />
              Web Search
            </TabsTrigger>
            <TabsTrigger
              value="business-limits"
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4 hidden sm:block" />
              Limits
            </TabsTrigger>
          </TabsList>
        </div>

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

        <TabsContent value="web-search">
          <WebSearchSettings />
        </TabsContent>

        <TabsContent value="business-limits">
          <BusinessLimitsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
