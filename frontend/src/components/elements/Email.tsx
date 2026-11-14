/**
 * An email address as text, with the "@" written as "[ät]" (or "[at]" on
 * English pages; see globals.css), so the address doesn't appear as such in
 * the page's text.
 */
export default function Email({ address }: { address: string }) {
  const [local, domain] = address.split("@");
  if (!domain) return address;
  return (
    <>
      {local}
      <span className="email-at" />
      {domain}
    </>
  );
}

const EMAIL = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/;

/** Text with any email addresses in it shown as <Email>. */
export function WithEmails({ text }: { text: string }) {
  const parts = text.split(EMAIL);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    index % 2 === 1 ? <Email key={index} address={part} /> : part,
  );
}
