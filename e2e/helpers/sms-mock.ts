const SMS_MOCK_URL = 'http://localhost:3030';

interface SmsMockMessage {
  to: string;
  date_created: string;
  body: string;
}

/** Polls the Twilio-compatible SMS mock for the most recent message to `to` sent at or after `sinceMs`. */
export async function getLatestSms(to: string, sinceMs: number, timeoutMs = 10_000): Promise<SmsMockMessage> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${SMS_MOCK_URL}/api/messages`);
    const messages = (await res.json()) as SmsMockMessage[];
    const match = messages.find(m => m.to === to && new Date(m.date_created).getTime() >= sinceMs);

    if (match) {
      return match;
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  throw new Error(`No SMS found for ${to}`);
}
