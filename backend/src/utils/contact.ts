export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export const CONTACT_LIMITS = { name: 200, email: 254, message: 5000 };

/**
 * The contact form has a field named "website" that is hidden from people
 * with CSS. Bots that fill in every input fill it in too.
 */
export const HONEYPOT_FIELD = "website";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return value.length <= CONTACT_LIMITS.email && EMAIL_PATTERN.test(value);
}

function stringField(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isHoneypotFilled(body: unknown): boolean {
  return isRecord(body) && stringField(body, HONEYPOT_FIELD) !== "";
}

/**
 * Picks the three fields the form sends and checks them. Anything else in the
 * body is ignored, so a request can't set `responded` or other columns.
 */
export function parseContactMessage(body: unknown): ContactMessage | null {
  if (!isRecord(body)) return null;

  const name = stringField(body, "name");
  const email = stringField(body, "email");
  const message = stringField(body, "message");

  if (!name || name.length > CONTACT_LIMITS.name) return null;
  if (!isValidEmail(email)) return null;
  if (!message || message.length > CONTACT_LIMITS.message) return null;

  return { name, email, message };
}

/** Recipients are entered in Strapi one per line; commas work too. */
export function parseRecipients(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(isValidEmail);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * The notification sent to the team. Everything in it was typed by a
 * stranger, so the HTML version escapes every value.
 */
export function contactEmailContent({ name, email, message }: ContactMessage): {
  text: string;
  html: string;
} {
  const text = `Name: ${name}\nEmail: ${email}\n\n${message}\n`;
  const html = [
    `<p><strong>Name:</strong> ${escapeHtml(name)}<br>`,
    `<strong>Email:</strong> ${escapeHtml(email)}</p>`,
    `<p style="white-space: pre-wrap">${escapeHtml(message)}</p>`,
  ].join("\n");
  return { text, html };
}
