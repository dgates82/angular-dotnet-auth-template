const MAILPIT_URL = 'http://localhost:8025';

interface MailpitMessageSummary {
  ID: string;
  Created: string;
  Subject: string;
}

interface MailpitMessage {
  HTML: string;
  Text: string;
}

/**
 * Polls Mailpit for the most recent message to `to` created at or after `sinceMs`,
 * optionally matching `subjectContains`. Throws if nothing shows up within the
 * timeout - email delivery in the local stack is near-instant, so a long wait here
 * usually means something upstream is actually broken, not just slow.
 */
export async function getLatestEmail(
  to: string,
  options: { subjectContains?: string; sinceMs?: number; timeoutMs?: number } = {}
): Promise<MailpitMessage> {
  const sinceMs = options.sinceMs ?? 0;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(to)}`);
    const data = (await res.json()) as { messages: MailpitMessageSummary[] };
    const match = data.messages
      .filter(m => new Date(m.Created).getTime() >= sinceMs)
      .find(m => !options.subjectContains || m.Subject.includes(options.subjectContains));

    if (match) {
      const full = await fetch(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
      return (await full.json()) as MailpitMessage;
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  throw new Error(`No email found for ${to}${options.subjectContains ? ` (subject contains "${options.subjectContains}")` : ''}`);
}

/** Extracts the first http(s) link containing `pathContains` from an email body. */
export function extractLink(email: MailpitMessage, pathContains: string): string {
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
