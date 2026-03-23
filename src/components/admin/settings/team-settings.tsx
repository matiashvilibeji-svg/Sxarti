"use client";

import { useState } from "react";
import { AdminUser } from "@/types/admin";
import { InviteAdminModal } from "./invite-admin-modal";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamSettingsProps {
  admins: AdminUser[];
}

const roleColors: Record<string, string> = {
  super_admin: "bg-teal-50 text-teal-700",
  admin: "bg-blue-50 text-blue-700",
  support: "bg-amber-50 text-amber-700",
  viewer: "bg-slate-100 text-slate-600",
};

const permissionIcons: Record<
  string,
  { roles: string[]; label: string; activeColor: string }
> = {
  write: {
    roles: ["super_admin", "admin"],
    label: "Write Access",
    activeColor: "bg-teal-500/10 text-teal-600",
  },
  api: {
    roles: ["super_admin", "admin"],
    label: "API Access",
    activeColor: "bg-blue-500/10 text-blue-600",
  },
  billing: {
    roles: ["super_admin", "admin"],
    label: "Billing Access",
    activeColor: "bg-amber-500/10 text-amber-600",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  "bg-indigo-100 text-indigo-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
];

export function TeamSettings({ admins }: TeamSettingsProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-semibold text-xl">Team Management</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Control who has access to the admin panel.
            </p>
          </div>
          <Button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                <th className="pb-4 px-2">Member</th>
                <th className="pb-4 px-2">Role</th>
                <th className="pb-4 px-2 hidden md:table-cell">Permissions</th>
                <th className="pb-4 px-2">Status</th>
                <th className="pb-4 px-2 hidden sm:table-cell">Last Login</th>
                <th className="pb-4 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-surface-container-high">
              {admins.map((admin, i) => (
                <tr
                  key={admin.id}
                  className="group hover:bg-surface-container-low/50 transition-colors"
                >
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${avatarColors[i % avatarColors.length]}`}
                      >
                        {getInitials(admin.display_name)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">
                          {admin.display_name}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          {admin.user_id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleColors[admin.role]}`}
                    >
                      {admin.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 px-2 hidden md:table-cell">
                    <div className="flex gap-1">
                      {Object.entries(permissionIcons).map(([key, perm]) => {
                        const active = perm.roles.includes(admin.role);
                        return (
                          <div
                            key={key}
                            title={perm.label}
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                              active
                                ? perm.activeColor
                                : "bg-surface-container-high text-on-surface-variant/30"
                            }`}
                          >
                            {key[0].toUpperCase()}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        admin.is_active ? "text-teal-600" : "text-red-600"
                      }`}
                    >
                      {admin.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 px-2 hidden sm:table-cell">
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      {admin.last_login_at
                        ? new Date(admin.last_login_at).toLocaleDateString()
                        : "Never"}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <button className="p-1 hover:text-red-600 transition-colors text-on-surface-variant">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-on-surface-variant"
                  >
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InviteAdminModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
