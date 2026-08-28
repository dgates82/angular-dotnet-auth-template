const SENDGRID_MOCK_URL = 'http://localhost:3040';

interface SendGridMockMessage {
  messageId: string;
  to: string;
  from: string;
  subject: string;
  body: string;
}

interface MailMessage {
  HTML: string;
  Text: string;
}

// sendgrid-mock doesn't return a separate timestamp field - messageId is
// "mock-msg-<epoch-ms>-<random>", so parse the epoch out of it instead.
function messageTimestampMs(messageId: string): number {
  const match = messageId.match(/^mock-msg-(\d+)-/);
  return match ? Number(match[1]) : 0;
}

/**
 * Polls the sendgrid-mock catcher for the most recent message to `to` sent at or after
 * `sinceMs`, optionally matching `subjectContains`. Throws if nothing shows up within the
 * timeout - email delivery in the local stack is near-instant, so a long wait here
 * usually means something upstream is actually broken, not just slow.
 */
export async function getLatestEmail(
  to: string,
  options: { subjectContains?: string; sinceMs?: number; timeoutMs?: number } = {}
): Promise<MailMessage> {
  const sinceMs = options.sinceMs ?? 0;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${SENDGRID_MOCK_URL}/api/messages`);
    const messages = (await res.json()) as SendGridMockMessage[];
    const matches = messages
      .filter(m => m.to === to && messageTimestampMs(m.messageId) >= sinceMs)
      .filter(m => !options.subjectContains || m.subject.includes(options.subjectContains))
      .sort((a, b) => messageTimestampMs(a.messageId) - messageTimestampMs(b.messageId));

    if (matches.length > 0) {
      const latest = matches[matches.length - 1];
      return { HTML: latest.body, Text: '' };
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  throw new Error(`No email found for ${to}${options.subjectContains ? ` (subject contains "${options.subjectContains}")` : ''}`);
}

/** Extracts the first http(s) link containing `pathContains` from an email body. */
export function extractLink(email: MailMessage, pathContains: string): string {
  const body = email.HTML || email.Text || '';
  const match = body.match(new RegExp(`http[^\\s"'<]*${pathContains}[^\\s"'<]*`));
  if (!match) {
    throw new Error(`No link containing "${pathContains}" found in email body`);
  }
  return match[0].replace(/&amp;/g, '&');
}

/** Extracts a 6-digit verification code from an email or SMS body. */
export function extractCode(body: string): string {
  const match = body.match(/(\d{6})/);
  if (!match) {
    throw new Error(`No 6-digit code found in body: ${body}`);
  }
  return match[1];
}
