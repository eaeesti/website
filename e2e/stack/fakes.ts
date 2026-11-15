/**
 * Stand-ins for the outside services the site and Strapi talk to, so a test
 * run never reaches a real one:
 *
 * - Email: an SMTP server (with STARTTLS, which Strapi insists on) keeps every
 *   message it gets. GET /emails lists them for the tests.
 * - Anneta Targalt's donation API: POST /api/donateExternal keeps the
 *   donation and sends the donor straight back to the site, as if they had
 *   paid; a monthly donation from "another bank" gets no link, as the real
 *   one does. GET /donations lists them.
 * - The events calendar (/calendar.ics, with an event ahead and one past,
 *   relative to today) and the podcast's RSS feed (/podcast.rss).
 *
 * The same handler listens on HTTP and, for the calendar, which the site
 * fetches only over HTTPS, on HTTPS with a certificate made for the run.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import type { IncomingMessage, ServerResponse } from "node:http";
import { simpleParser } from "mailparser";
import { SMTPServer } from "smtp-server";
import { CERT_FILE, KEY_FILE, PORTS } from "./config.ts";
import { TEXT } from "./content.ts";

export interface Email {
  to: string[];
  from: string;
  replyTo: string;
  subject: string;
  text: string;
}

export type Donation = Record<string, unknown>;

const emails: Email[] = [];
const donations: Donation[] = [];

function makeCertificate() {
  if (existsSync(CERT_FILE) && existsSync(KEY_FILE)) return;
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-days",
      "3650",
      "-keyout",
      KEY_FILE,
      "-out",
      CERT_FILE,
      "-subj",
      "/CN=localhost",
      "-addext",
      "subjectAltName=DNS:localhost,IP:127.0.0.1",
    ],
    { stdio: "ignore" },
  );
}

function startSmtp() {
  const smtp = new SMTPServer({
    key: readFileSync(KEY_FILE),
    cert: readFileSync(CERT_FILE),
    authOptional: true,
    logger: false,
    onAuth(_auth, _session, callback) {
      callback(null, { user: "e2e" });
    },
    onData(stream, session, callback) {
      simpleParser(stream)
        .then((parsed) => {
          emails.push({
            to: session.envelope.rcptTo.map((r) => r.address.toLowerCase()),
            from: parsed.from?.text ?? "",
            replyTo: parsed.replyTo?.text ?? "",
            subject: parsed.subject ?? "",
            text: parsed.text ?? "",
          });
          callback();
        })
        .catch((error: unknown) =>
          callback(error instanceof Error ? error : new Error(String(error))),
        );
    },
  });
  smtp.listen(PORTS.smtp, "127.0.0.1");
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

/** The donation form posts from the site's origin. */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function send(
  res: ServerResponse,
  status: number,
  body: string,
  type = "application/json",
) {
  res.writeHead(status, { "Content-Type": type, ...CORS });
  res.end(body);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function donate(body: string): { status: number; value: unknown } {
  let donation: unknown;
  try {
    donation = JSON.parse(body);
  } catch {
    donation = null;
  }
  if (!isRecord(donation) || typeof donation.returnUrl !== "string") {
    return { status: 400, value: { error: { message: "Bad donation" } } };
  }
  donations.push(donation);
  const noLink = donation.type === "recurring" && donation.bank === "other";
  return {
    status: 200,
    value: { redirectURL: noLink ? "" : donation.returnUrl },
  };
}

/** "20261125T160000Z" for a time this many days from now. */
function icalTime(daysFromNow: number) {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  date.setUTCHours(16, 0, 0, 0);
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** A two-hour event, this many days from now. */
const icalEvent = (uid: string, summary: string, days: number) => [
  "BEGIN:VEVENT",
  `UID:${uid}@e2e.test`,
  `DTSTAMP:${icalTime(0)}`,
  `DTSTART:${icalTime(days)}`,
  `DTEND:${icalTime(days).replace("T16", "T18")}`,
  `SUMMARY:${summary}`,
  "LOCATION:Telliskivi 60a\\, 10412 Tallinn\\, Eesti",
  "END:VEVENT",
];

function calendar() {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//e2e//calendar//ET",
    ...icalEvent("upcoming", TEXT.upcomingEvent, 10),
    ...icalEvent("past", TEXT.pastEvent, -10),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

const PODCAST = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${TEXT.podcastTitle}</title>
    <item>
      <title>${TEXT.episodeTitle}</title>
      <link>https://open.spotify.com/episode/e2e</link>
      <pubDate>Mon, 12 Jan 2026 08:00:00 GMT</pubDate>
      <itunes:duration>00:45:10</itunes:duration>
      <description>&lt;p&gt;Räägime, kust alustada.&lt;/p&gt;</description>
    </item>
  </channel>
</rss>`;

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://fakes");
  if (req.method === "OPTIONS") return send(res, 204, "");
  if (url.pathname === "/health") return send(res, 200, "{}");
  if (url.pathname === "/emails") {
    const to = url.searchParams.get("to")?.toLowerCase();
    const list = to ? emails.filter((email) => email.to.includes(to)) : emails;
    return send(res, 200, JSON.stringify(list));
  }
  if (url.pathname === "/donations") {
    return send(res, 200, JSON.stringify(donations));
  }
  if (url.pathname === "/api/donateExternal" && req.method === "POST") {
    const { status, value } = donate(await readBody(req));
    return send(res, status, JSON.stringify(value));
  }
  if (url.pathname === "/calendar.ics") {
    return send(res, 200, calendar(), "text/calendar; charset=utf-8");
  }
  if (url.pathname === "/podcast.rss") {
    return send(res, 200, PODCAST, "application/rss+xml; charset=utf-8");
  }
  return send(res, 404, "{}");
}

const handler = (req: IncomingMessage, res: ServerResponse) => {
  handle(req, res).catch((error: unknown) => {
    send(res, 500, JSON.stringify({ error: String(error) }));
  });
};

makeCertificate();
startSmtp();
createServer(handler).listen(PORTS.fakes, "127.0.0.1");
createHttpsServer(
  { key: readFileSync(KEY_FILE), cert: readFileSync(CERT_FILE) },
  handler,
).listen(PORTS.fakesHttps, "127.0.0.1");
console.log(
  `Fakes on ${PORTS.fakes} (HTTPS ${PORTS.fakesHttps}), SMTP on ${PORTS.smtp}`,
);
