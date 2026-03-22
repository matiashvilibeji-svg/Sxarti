import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_COLUMNS = ["Name", "Price", "Stock", "Description", "Active"];

function base64UrlEncode(input: Uint8Array | string): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getGoogleAccessToken(): Promise<string> {
  const keyJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
  if (!keyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");

  const sa = JSON.parse(keyJson);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPES.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );

  const signInput = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signInput),
  );

  const jwt = `${signInput}.${base64UrlEncode(new Uint8Array(sig))}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) throw new Error(`Token error: ${await tokenRes.text()}`);
  const data = await tokenRes.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find tenants with google_sheet_id (business/premium only)
    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("id, google_sheet_id, subscription_plan")
      .not("google_sheet_id", "is", null)
      .in("subscription_plan", ["business", "premium"]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tenants || tenants.length === 0) {
      return new Response(
        JSON.stringify({ message: "No tenants to sync", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accessToken = await getGoogleAccessToken();
    const results: { tenant_id: string; success: boolean; error?: string }[] =
      [];

    for (const tenant of tenants) {
      try {
        // Push products to sheet (DB wins)
        const { data: products } = await supabase
          .from("products")
          .select("name, price, stock_quantity, description, is_active")
          .eq("tenant_id", tenant.id)
          .order("name");

        const rows = [
          SHEET_COLUMNS,
          ...(products || []).map((p: Record<string, unknown>) => [
            p.name,
            p.price,
            p.stock_quantity,
            p.description || "",
            p.is_active ? "TRUE" : "FALSE",
          ]),
        ];

        const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${tenant.google_sheet_id}/values/A1?valueInputOption=USER_ENTERED`;
        const res = await fetch(sheetUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values: rows }),
        });

        if (!res.ok) {
          results.push({
            tenant_id: tenant.id,
            success: false,
            error: await res.text(),
          });
        } else {
          results.push({ tenant_id: tenant.id, success: true });
        }
      } catch (err) {
        results.push({
          tenant_id: tenant.id,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return new Response(
      JSON.stringify({
        synced: results.filter((r) => r.success).length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
