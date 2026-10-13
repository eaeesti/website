import { describe, it, expect } from "vitest";
import {
  CONTACT_LIMITS,
  contactEmailContent,
  escapeHtml,
  isHoneypotFilled,
  parseContactMessage,
  parseRecipients,
} from "../contact";

describe("parseContactMessage", () => {
  const valid = { name: "Mari", email: "mari@example.com", message: "Tere!" };

  it("accepts a complete message and trims it", () => {
    expect(
      parseContactMessage({
        name: "  Mari ",
        email: " mari@example.com",
        message: "Tere! ",
      }),
    ).toEqual(valid);
  });

  it("drops fields the form doesn't send", () => {
    expect(parseContactMessage({ ...valid, responded: true })).toEqual(valid);
  });

  it("rejects missing or empty fields", () => {
    expect(parseContactMessage({ ...valid, name: "" })).toBeNull();
    expect(parseContactMessage({ ...valid, message: "   " })).toBeNull();
    expect(parseContactMessage({ email: valid.email })).toBeNull();
  });

  it("rejects an invalid email", () => {
    expect(parseContactMessage({ ...valid, email: "mari" })).toBeNull();
    expect(
      parseContactMessage({ ...valid, email: "mari@ex ample.com" }),
    ).toBeNull();
  });

  it("rejects over-long fields", () => {
    const long = "a".repeat(CONTACT_LIMITS.message + 1);
    expect(parseContactMessage({ ...valid, message: long })).toBeNull();
  });

  it("rejects non-string values and non-object bodies", () => {
    expect(parseContactMessage({ ...valid, name: 42 })).toBeNull();
    expect(parseContactMessage(null)).toBeNull();
    expect(parseContactMessage([valid])).toBeNull();
    expect(parseContactMessage("hello")).toBeNull();
  });
});

describe("isHoneypotFilled", () => {
  it("is true only when the hidden field has content", () => {
    expect(isHoneypotFilled({ website: "http://spam.example" })).toBe(true);
    expect(isHoneypotFilled({ website: "" })).toBe(false);
    expect(isHoneypotFilled({})).toBe(false);
    expect(isHoneypotFilled(undefined)).toBe(false);
  });
});

describe("parseRecipients", () => {
  it("splits on newlines and commas and drops invalid entries", () => {
    expect(
      parseRecipients("a@example.com\r\n b@example.com,\nnot-an-email\n\n"),
    ).toEqual(["a@example.com", "b@example.com"]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseRecipients(null)).toEqual([]);
    expect(parseRecipients("")).toEqual([]);
  });
});

describe("contactEmailContent", () => {
  it("escapes everything the sender typed in the HTML version", () => {
    const { html, text } = contactEmailContent({
      name: "<script>alert(1)</script>",
      email: "x@example.com",
      message: 'Click <a href="http://evil.example">here</a>',
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('<a href="http://evil.example">');
    expect(html).toContain("&lt;script&gt;");
    expect(text).toContain("<script>alert(1)</script>");
  });
});

describe("escapeHtml", () => {
  it("escapes the five significant characters", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#039;");
  });
});
