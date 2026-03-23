import { createClient } from "@/lib/supabase/server";
import { SystemHealthCheck, AuditLogEntry } from "@/types/admin";
import { OverallStatus } from "@/components/admin/system-health/overall-status";
import { ServiceGrid } from "@/components/admin/system-health/service-grid";
import { ResponseTimeChart } from "@/components/admin/system-health/response-time-chart";
import { IncidentLog } from "@/components/admin/system-health/incident-log";
import { AuditTrail } from "@/components/admin/system-health/audit-trail";

export default async function SystemHealthPage() {
  const supabase = createClient();

  // Fetch latest health check per service
  const { data: latestChecks } = await supabase
    .from("system_health_checks")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(100);

  // Deduplicate to get latest per service
  const seen = new Set<string>();
  const latestPerService: SystemHealthCheck[] = [];
  for (const check of (latestChecks ?? []) as SystemHealthCheck[]) {
    if (!seen.has(check.service_name)) {
      seen.add(check.service_name);
      latestPerService.push(check);
    }
  }

  // Historical checks for last 24h (for charts/sparklines)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: historicalChecks } = await supabase
    .from("system_health_checks")
    .select("*")
    .gte("checked_at", oneDayAgo)
    .order("checked_at", { ascending: true })
    .limit(500);

  // Incidents (non-healthy checks)
  const { data: incidents } = await supabase
    .from("system_health_checks")
    .select("*")
    .neq("status", "healthy")
    .order("checked_at", { ascending: false })
    .limit(50);

  // Audit log entries
  const { data: auditEntries } = await supabase
    .from("audit_log")
    .select("*, admin:admin_users(*)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <OverallStatus healthChecks={latestPerService} />

      <ServiceGrid
        healthChecks={latestPerService}
        historicalChecks={(historicalChecks ?? []) as SystemHealthCheck[]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ResponseTimeChart
          historicalChecks={(historicalChecks ?? []) as SystemHealthCheck[]}
        />
        <IncidentLog incidents={(incidents ?? []) as SystemHealthCheck[]} />
      </div>

      <AuditTrail entries={(auditEntries ?? []) as AuditLogEntry[]} />
    </div>
  );
}
