import { describe, it, expect } from "vitest";
import {
  donationRequestBody,
  parseEuroAmount,
  validateIdCode,
} from "../donation";

describe("validateIdCode", () => {
  it("accepts valid codes, including ones that need the second check", () => {
    expect(validateIdCode("60001019906")).toBe(true);
    expect(validateIdCode("37605030299")).toBe(true);
    expect(validateIdCode("39001010000")).toBe(true);
    // The first weighting gives 10 here, so the second one decides.
    expect(validateIdCode("39001010110")).toBe(true);
  });

  it("rejects a wrong check digit, wrong length and wrong format", () => {
    expect(validateIdCode("37605030298")).toBe(false);
    expect(validateIdCode("39001010111")).toBe(false);
    expect(validateIdCode("3760503029")).toBe(false);
    expect(validateIdCode("376050302991")).toBe(false);
    expect(validateIdCode("77605030299")).toBe(false);
    expect(validateIdCode("3760503029a")).toBe(false);
  });
});

describe("parseEuroAmount", () => {
  it("parses whole and decimal euros with either separator", () => {
    expect(parseEuroAmount("25")).toBe(2500);
    expect(parseEuroAmount("12,50")).toBe(1250);
    expect(parseEuroAmount(" 12.5 ")).toBe(1250);
    expect(parseEuroAmount("1 000")).toBe(100000);
  });

  it("rejects amounts out of range or not numbers", () => {
    expect(parseEuroAmount("0,99")).toBeNull();
    expect(parseEuroAmount("15000")).toBeNull();
    expect(parseEuroAmount("14999,99")).toBe(1499999);
    expect(parseEuroAmount("12,345")).toBeNull();
    expect(parseEuroAmount("abc")).toBeNull();
    expect(parseEuroAmount("")).toBeNull();
  });
});

describe("donationRequestBody", () => {
  const values = {
    amountCents: 2000,
    firstName: " Mari ",
    lastName: "Tamm",
    email: "mari@example.com",
    idCode: "60001019906",
    bank: "lhv" as const,
    company: null,
  };
  const returnUrl = "https://efektiivnealtruism.org/annetatud";

  it("sends one-time donations through payment initiation", () => {
    expect(
      donationRequestBody({ ...values, frequency: "onetime" }, returnUrl),
    ).toEqual({
      type: "onetime",
      firstName: "Mari",
      lastName: "Tamm",
      email: "mari@example.com",
      idCode: "60001019906",
      amount: 2000,
      returnUrl,
      paymentMethod: "paymentInitiation",
    });
  });

  it("sends the bank for recurring donations, and company details when given", () => {
    expect(
      donationRequestBody(
        {
          ...values,
          frequency: "recurring",
          company: { name: "Kuuse Puit OÜ ", code: "12345678" },
        },
        returnUrl,
      ),
    ).toMatchObject({
      type: "recurring",
      bank: "lhv",
      companyName: "Kuuse Puit OÜ",
      companyCode: "12345678",
    });
  });
});
