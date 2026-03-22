const GRAPH_API = "https://graph.facebook.com/v19.0";
const MAX_MESSAGE_LENGTH = 2000;

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLen) {
    let splitIndex = remaining.lastIndexOf(". ", maxLen);
    if (splitIndex === -1 || splitIndex < maxLen / 2) {
      splitIndex = remaining.lastIndexOf(" ", maxLen);
    }
    if (splitIndex === -1 || splitIndex < maxLen / 2) {
      splitIndex = maxLen;
    } else {
      splitIndex += 1; // include the space/period
    }
    chunks.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

export async function sendMessage(
  pageAccessToken: string,
  recipientId: string,
  text: string,
): Promise<void> {
  const chunks = splitMessage(text, MAX_MESSAGE_LENGTH);

  for (const chunk of chunks) {
    const response = await fetch(`${GRAPH_API}/me/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pageAccessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: "RESPONSE",
        message: { text: chunk },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Facebook Send API error ${response.status}: ${error}`);
    }
  }
}

export async function sendMessageWithRetry(
  pageAccessToken: string,
  recipientId: string,
  text: string,
  maxRetries = 3,
): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await sendMessage(pageAccessToken, recipientId, text);
      return;
    } catch (error) {
      const isServerError =
        error instanceof Error && error.message.includes("5");
      const isLastAttempt = attempt === maxRetries - 1;

      if (!isServerError || isLastAttempt) {
        throw error;
      }

      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
