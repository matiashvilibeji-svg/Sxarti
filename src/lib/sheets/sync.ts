import { createAdminClient } from "@/lib/supabase/admin";
import type { Product, Tenant } from "@/types/database";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_COLUMNS = ["Name", "Price", "Stock", "Description", "Active"];

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createJWT(serviceAccount: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: SCOPES.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );

  const signInput = `${header}.${claim}`;

  const key = await globalThis.crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await globalThis.crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signInput),
  );

  const sig = base64UrlEncode(
    String.fromCharCode(...Array.from(new Uint8Array(signature))),
  );
  return `${signInput}.${sig}`;
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

async function getAccessToken(): Promise<string> {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");

  const serviceAccount = JSON.parse(keyJson);
  const jwt = await createJWT(serviceAccount);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function sheetsApi(
  accessToken: string,
  sheetId: string,
  range: string,
  method: "GET" | "PUT" = "GET",
  body?: unknown,
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  if (method === "PUT" && body) {
    (options as RequestInit & { body: string }).body = JSON.stringify({
      values: body,
      valueInputOption: "USER_ENTERED",
    });
    const putUrl = `${url}?valueInputOption=USER_ENTERED`;
    const response = await fetch(putUrl, options);
    if (!response.ok)
      throw new Error(`Sheets API error: ${await response.text()}`);
    return response.json();
  }

  const response = await fetch(url, options);
  if (!response.ok)
    throw new Error(`Sheets API error: ${await response.text()}`);
  return response.json();
}

export async function syncToSheet(
  tenantId: string,
  sheetId: string,
): Promise<{ success: boolean; error?: string; synced?: number }> {
  const supabase = createAdminClient();

  // Guard: only business and premium tenants
  const { data: tenant } = await supabase
    .from("tenants")
    .select("subscription_plan")
    .eq("id", tenantId)
    .single();

  if (
    !tenant ||
    !["business", "premium"].includes(
      (tenant as Pick<Tenant, "subscription_plan">).subscription_plan,
    )
  ) {
    return {
      success: false,
      error: "Sheets sync requires Business or Premium plan",
    };
  }

  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name");

    if (error) return { success: false, error: error.message };

    const accessToken = await getAccessToken();

    const rows = [
      SHEET_COLUMNS,
      ...(products as Product[]).map((p) => [
        p.name,
        p.price,
        p.stock_quantity,
        p.description || "",
        p.is_active ? "TRUE" : "FALSE",
      ]),
    ];

    await sheetsApi(accessToken, sheetId, "A1", "PUT", rows);

    return { success: true, synced: products?.length || 0 };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function syncFromSheet(
  tenantId: string,
  sheetId: string,
): Promise<{ success: boolean; error?: string; updated?: number }> {
  const supabase = createAdminClient();

  // Guard: only business and premium tenants
  const { data: tenant } = await supabase
    .from("tenants")
    .select("subscription_plan")
    .eq("id", tenantId)
    .single();

  if (
    !tenant ||
    !["business", "premium"].includes(
      (tenant as Pick<Tenant, "subscription_plan">).subscription_plan,
    )
  ) {
    return {
      success: false,
      error: "Sheets sync requires Business or Premium plan",
    };
  }

  try {
    const accessToken = await getAccessToken();

    const result = await sheetsApi(accessToken, sheetId, "A:E");
    const rows: string[][] = result.values || [];

    if (rows.length < 2) {
      return { success: true, updated: 0 };
    }

    // Skip header row
    const dataRows = rows.slice(1);
    let updated = 0;

    for (const row of dataRows) {
      const [name, priceStr, stockStr, description, activeStr] = row;
      if (!name) continue;

      const price = parseFloat(priceStr);
      const stock = parseInt(stockStr, 10);
      const isActive = activeStr?.toUpperCase() === "TRUE";

      // Upsert by tenant_id + name (Sheet wins on pull)
      const { error } = await supabase.from("products").upsert(
        {
          tenant_id: tenantId,
          name,
          price: isNaN(price) ? 0 : price,
          stock_quantity: isNaN(stock) ? 0 : stock,
          description: description || null,
          is_active: isActive,
        },
        { onConflict: "tenant_id,name" },
      );

      if (!error) updated++;
    }

    return { success: true, updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
