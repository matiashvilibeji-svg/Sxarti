const GRAPH_API = "https://graph.facebook.com/v19.0";

interface MetaCampaignData {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

interface MetaAdSetData {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  targeting?: Record<string, unknown>;
}

interface MetaAdData {
  id: string;
  name: string;
  status: string;
  adset_id: string;
  creative?: { thumbnail_url?: string };
}

interface MetaInsightData {
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  date_start: string;
  date_stop: string;
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  ctr: string;
  cpc: string;
  cpm: string;
  actions?: { action_type: string; value: string }[];
  purchase_roas?: { action_type: string; value: string }[];
}

interface MetaAdAccountInfo {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
}

interface PaginatedResponse<T> {
  data: T[];
  paging?: {
    cursors?: { before: string; after: string };
    next?: string;
  };
}

export class MetaApiError extends Error {
  code: number;
  subcode?: number;

  constructor(message: string, code: number, subcode?: number) {
    super(message);
    this.name = "MetaApiError";
    this.code = code;
    this.subcode = subcode;
  }

  get isTokenExpired(): boolean {
    return this.code === 190;
  }
}

async function fetchAllPages<T>(
  url: string,
  accessToken: string,
): Promise<T[]> {
  const allData: T[] = [];
  let nextUrl: string | null = `${url}&access_token=${accessToken}`;

  while (nextUrl) {
    const response = await fetch(nextUrl);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const metaError = errorBody?.error;
      if (metaError?.code) {
        throw new MetaApiError(
          metaError.message ?? "Meta API error",
          metaError.code,
          metaError.error_subcode,
        );
      }
      throw new Error(
        `Meta API error (${response.status}): ${JSON.stringify(errorBody)}`,
      );
    }
    const result: PaginatedResponse<T> = await response.json();
    allData.push(...result.data);
    nextUrl = result.paging?.next ?? null;
  }

  return allData;
}

export async function getAdAccounts(
  userAccessToken: string,
): Promise<MetaAdAccountInfo[]> {
  const url = `${GRAPH_API}/me/adaccounts?fields=name,account_id,account_status`;
  return fetchAllPages<MetaAdAccountInfo>(url, userAccessToken);
}

export async function exchangeForLongLivedToken(
  shortToken: string,
): Promise<string> {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Facebook app credentials are not configured");
  }

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });

  const response = await fetch(
    `${GRAPH_API}/oauth/access_token?${params.toString()}`,
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Long-lived token exchange failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export function getAdsOAuthUrl(redirectUri: string, state?: string): string {
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) throw new Error("FACEBOOK_APP_ID is not configured");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "ads_read",
    response_type: "code",
  });

  if (state) params.set("state", state);

  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

export async function fetchCampaigns(
  adAccountId: string,
  accessToken: string,
): Promise<MetaCampaignData[]> {
  const url = `${GRAPH_API}/act_${adAccountId}/campaigns?fields=name,status,objective,daily_budget,lifetime_budget&limit=100`;
  return fetchAllPages<MetaCampaignData>(url, accessToken);
}

export async function fetchAdSets(
  adAccountId: string,
  accessToken: string,
): Promise<MetaAdSetData[]> {
  const url = `${GRAPH_API}/act_${adAccountId}/adsets?fields=name,status,campaign_id,targeting&limit=100`;
  return fetchAllPages<MetaAdSetData>(url, accessToken);
}

export async function fetchAds(
  adAccountId: string,
  accessToken: string,
): Promise<MetaAdData[]> {
  const url = `${GRAPH_API}/act_${adAccountId}/ads?fields=name,status,adset_id,creative{thumbnail_url}&limit=100`;
  return fetchAllPages<MetaAdData>(url, accessToken);
}

export async function fetchInsights(
  adAccountId: string,
  accessToken: string,
  dateFrom: string,
  dateTo: string,
  level: "campaign" | "adset" | "ad" = "campaign",
): Promise<MetaInsightData[]> {
  const fields =
    "campaign_id,adset_id,ad_id,impressions,clicks,spend,reach,ctr,cpc,cpm,actions,purchase_roas";
  const url =
    `${GRAPH_API}/act_${adAccountId}/insights?fields=${fields}` +
    `&level=${level}` +
    `&time_range={"since":"${dateFrom}","until":"${dateTo}"}` +
    `&time_increment=1` +
    `&limit=500`;
  return fetchAllPages<MetaInsightData>(url, accessToken);
}

export async function fetchDemographicInsights(
  adAccountId: string,
  accessToken: string,
  dateFrom: string,
  dateTo: string,
): Promise<MetaInsightData[]> {
  const fields = "campaign_id,impressions,clicks,spend";
  const url =
    `${GRAPH_API}/act_${adAccountId}/insights?fields=${fields}` +
    `&level=campaign` +
    `&time_range={"since":"${dateFrom}","until":"${dateTo}"}` +
    `&breakdowns=age,gender` +
    `&limit=500`;
  return fetchAllPages<MetaInsightData>(url, accessToken);
}

export type {
  MetaCampaignData,
  MetaAdSetData,
  MetaAdData,
  MetaInsightData,
  MetaAdAccountInfo,
};
