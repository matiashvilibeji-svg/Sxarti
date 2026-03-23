"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export function GeneralSettings() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platformName: "Sxarti",
    supportEmail: "support@sxarti.io",
    defaultLanguage: "ka",
    maintenanceMode: false,
    maintenanceMessage: "",
    limitsStarter: 100,
    limitsBusiness: 500,
    limitsPremium: 2000,
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    // TODO: Save to platform_settings table or API
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 space-y-6">
        <h3 className="font-semibold text-lg">Platform Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              Platform Name
            </Label>
            <Input
              value={form.platformName}
              onChange={(e) => update("platformName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              Support Email
            </Label>
            <Input
              type="email"
              value={form.supportEmail}
              onChange={(e) => update("supportEmail", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
            Default Language
          </Label>
          <Select
            value={form.defaultLanguage}
            onValueChange={(v) => update("defaultLanguage", v)}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ka">ქართული (Georgian)</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ru">Русский (Russian)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Maintenance Mode */}
        <div className="space-y-3">
          <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
            Maintenance Mode
          </Label>
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
            <span className="text-sm font-medium">Enable maintenance mode</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.maintenanceMode}
              onClick={() => update("maintenanceMode", !form.maintenanceMode)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                form.maintenanceMode
                  ? "bg-primary"
                  : "bg-surface-container-high"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.maintenanceMode ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          {form.maintenanceMode && (
            <Input
              placeholder="Maintenance message shown to users..."
              value={form.maintenanceMessage}
              onChange={(e) => update("maintenanceMessage", e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Conversation Limits */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 space-y-6">
        <h3 className="font-semibold text-lg">Conversation Limits per Plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              Starter (₾49/mo)
            </Label>
            <Input
              type="number"
              value={form.limitsStarter}
              onChange={(e) =>
                update("limitsStarter", parseInt(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              Business (₾149/mo)
            </Label>
            <Input
              type="number"
              value={form.limitsBusiness}
              onChange={(e) =>
                update("limitsBusiness", parseInt(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              Premium (₾299/mo)
            </Label>
            <Input
              type="number"
              value={form.limitsPremium}
              onChange={(e) =>
                update("limitsPremium", parseInt(e.target.value) || 0)
              }
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
