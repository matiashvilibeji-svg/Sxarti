"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Shield } from "lucide-react";

export function SecuritySettings() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    require2FA: true,
    sessionTimeout: "4h",
    ipWhitelist: "",
    rateLimiting: true,
    rateLimit: 60,
    auditRetention: "90",
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      {/* 2FA & Sessions */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Authentication & Sessions</h3>
        </div>

        <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
          <div>
            <span className="text-sm font-medium">
              Require 2FA for all admins
            </span>
            <p className="text-[10px] text-on-surface-variant">
              Enforce two-factor authentication on login
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.require2FA}
            onClick={() => update("require2FA", !form.require2FA)}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
              form.require2FA ? "bg-primary" : "bg-surface-container-high"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.require2FA ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
            Session Timeout
          </Label>
          <Select
            value={form.sessionTimeout}
            onValueChange={(v) => update("sessionTimeout", v)}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="4h">4 Hours</SelectItem>
              <SelectItem value="8h">8 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Access Control */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 space-y-6">
        <h3 className="font-semibold text-lg">Access Control</h3>

        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
            IP Whitelist
          </Label>
          <Textarea
            placeholder="Enter IP addresses, one per line..."
            className="font-mono text-xs min-h-[100px]"
            value={form.ipWhitelist}
            onChange={(e) => update("ipWhitelist", e.target.value)}
          />
          <p className="text-[10px] text-on-surface-variant">
            Leave empty to allow all IPs. Only whitelisted IPs will be able to
            access the admin panel.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
            <div>
              <span className="text-sm font-medium">API Rate Limiting</span>
              <p className="text-[10px] text-on-surface-variant">
                Limit API calls per minute to prevent abuse
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.rateLimiting}
              onClick={() => update("rateLimiting", !form.rateLimiting)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                form.rateLimiting ? "bg-primary" : "bg-surface-container-high"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.rateLimiting ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          {form.rateLimiting && (
            <div className="pl-3 flex items-center gap-3">
              <Input
                type="number"
                className="w-24"
                value={form.rateLimit}
                onChange={(e) =>
                  update("rateLimit", parseInt(e.target.value) || 0)
                }
              />
              <span className="text-xs text-on-surface-variant">
                requests per minute
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 space-y-6">
        <h3 className="font-semibold text-lg">Data Retention</h3>
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
            Audit Log Retention
          </Label>
          <Select
            value={form.auditRetention}
            onValueChange={(v) => update("auditRetention", v)}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="60">60 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
              <SelectItem value="365">365 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Security Settings"}
        </Button>
      </div>
    </div>
  );
}
