"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  children,
}: ToggleRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
        <div>
          <span className="text-sm font-medium">{label}</span>
          {description && (
            <p className="text-[10px] text-on-surface-variant">{description}</p>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
            checked ? "bg-primary" : "bg-surface-container-high"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {checked && children && <div className="pl-3">{children}</div>}
    </div>
  );
}

export function NotificationSettings() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    newTickets: true,
    healthAlerts: true,
    healthSeverity: "warning",
    newSignups: true,
    subscriptionChanges: false,
    dailyDigest: false,
    dailyDigestTime: "09:00",
    emailChannel: "admin@sxarti.io",
    telegramChannel: "",
    slackWebhookUrl: "",
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
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 space-y-4">
        <h3 className="font-semibold text-lg">Alert Configuration</h3>

        <ToggleRow
          label="New ticket notifications"
          description="Get notified when customers create support tickets"
          checked={form.newTickets}
          onChange={(v) => update("newTickets", v)}
        />

        <ToggleRow
          label="System health alerts"
          description="Get alerts when services degrade or go down"
          checked={form.healthAlerts}
          onChange={(v) => update("healthAlerts", v)}
        >
          <select
            className="bg-surface-container-lowest border border-outline-variant/20 text-xs font-semibold rounded-lg px-3 py-1.5"
            value={form.healthSeverity}
            onChange={(e) => update("healthSeverity", e.target.value)}
          >
            <option value="all">All severities</option>
            <option value="warning">Warning & Critical</option>
            <option value="critical">Critical only</option>
          </select>
        </ToggleRow>

        <ToggleRow
          label="New business signup notifications"
          description="Get notified when a new business registers"
          checked={form.newSignups}
          onChange={(v) => update("newSignups", v)}
        />

        <ToggleRow
          label="Subscription changes"
          description="Get notified on plan upgrades, downgrades, and cancellations"
          checked={form.subscriptionChanges}
          onChange={(v) => update("subscriptionChanges", v)}
        />

        <ToggleRow
          label="Daily digest email"
          description="Receive a summary of key metrics every day"
          checked={form.dailyDigest}
          onChange={(v) => update("dailyDigest", v)}
        >
          <Input
            type="time"
            className="w-32"
            value={form.dailyDigestTime}
            onChange={(e) => update("dailyDigestTime", e.target.value)}
          />
        </ToggleRow>
      </div>

      {/* Notification Channels */}
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 space-y-6">
        <h3 className="font-semibold text-lg">Notification Channels</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              Email
            </Label>
            <Input
              type="email"
              value={form.emailChannel}
              onChange={(e) => update("emailChannel", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              Telegram Bot Token / Chat ID
            </Label>
            <Input
              placeholder="bot123:chatid456"
              value={form.telegramChannel}
              onChange={(e) => update("telegramChannel", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              Slack Webhook URL
            </Label>
            <Input
              placeholder="https://hooks.slack.com/services/..."
              value={form.slackWebhookUrl}
              onChange={(e) => update("slackWebhookUrl", e.target.value)}
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
          {saving ? "Saving..." : "Save Notifications"}
        </Button>
      </div>
    </div>
  );
}
