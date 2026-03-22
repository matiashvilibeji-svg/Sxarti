const GRAPH_API = "https://graph.facebook.com/v19.0";

interface PageInfo {
  id: string;
  name: string;
  access_token: string;
}

export function getOAuthUrl(redirectUri: string, state?: string): string {
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) throw new Error("FACEBOOK_APP_ID is not configured");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "pages_messaging,pages_show_list",
    response_type: "code",
  });

  if (state) params.set("state", state);

  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<string> {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Facebook app credentials are not configured");
  }

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(
    `${GRAPH_API}/oauth/access_token?${params.toString()}`,
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function getPageAccessToken(
  userAccessToken: string,
): Promise<PageInfo[]> {
  const response = await fetch(
    `${GRAPH_API}/me/accounts?access_token=${userAccessToken}`,
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch pages: ${error}`);
  }

  const data = await response.json();
  return data.data.map(
    (page: { id: string; name: string; access_token: string }) => ({
      id: page.id,
      name: page.name,
      access_token: page.access_token,
    }),
  );
}

export async function subscribePage(
  pageId: string,
  pageAccessToken: string,
): Promise<void> {
  const response = await fetch(`${GRAPH_API}/${pageId}/subscribed_apps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pageAccessToken}`,
    },
    body: JSON.stringify({
      subscribed_fields: "messages,messaging_postbacks",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Page subscription failed: ${error}`);
  }
}
