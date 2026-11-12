import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  configuredNetworks,
  FixedWindowLimiter,
  isInternalAddress,
  parseNetworks,
} from "../rate-limiter";

describe("isInternalAddress", () => {
  it.each([
    "127.0.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "172.17.0.2",
    "::ffff:172.17.0.2",
    "10.0.0.5",
    "192.168.1.10",
    "fd00::1",
  ])("counts %s as this machine's", (ip) => {
    expect(isInternalAddress(ip, undefined)).toBe(true);
  });

  it.each([
    "203.0.113.10",
    "8.8.8.8",
    // Outside 172.16.0.0/12, so not private without INTERNAL_NETWORKS.
    "172.32.0.2",
    "172.15.255.255",
    "::ffff:8.8.8.8",
    "2a03:4000::1",
    "",
    "not an address",
  ])("counts %s as a visitor's", (ip) => {
    expect(isInternalAddress(ip, undefined)).toBe(false);
  });

  it("adds the networks in INTERNAL_NETWORKS", () => {
    const raw = "172.32.0.0/24, 2001:db8::/64";
    expect(isInternalAddress("172.32.0.2", raw)).toBe(true);
    expect(isInternalAddress("::ffff:172.32.0.2", raw)).toBe(true);
    expect(isInternalAddress("2001:db8::5", raw)).toBe(true);
    expect(isInternalAddress("172.32.1.2", raw)).toBe(false);
    expect(isInternalAddress("127.0.0.1", raw)).toBe(true);
  });
});

describe("parseNetworks", () => {
  it("names the entries it can't read", () => {
    const entries = configuredNetworks(
      "172.32.0.0/24,,172.32.0.0, 300.1.1.1/8 ,10.0.0.0/33,::/129,1.2.3.4/x",
    );
    expect(parseNetworks(entries).invalid).toEqual([
      "172.32.0.0",
      "300.1.1.1/8",
      "10.0.0.0/33",
      "::/129",
      "1.2.3.4/x",
    ]);
  });
});

describe("FixedWindowLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("tryConsume", () => {
    it("allows exactly `max` calls in a window, then denies", () => {
      const limiter = new FixedWindowLimiter(5, 60_000);

      for (let i = 0; i < 5; i++) {
        expect(limiter.tryConsume("a")).toBe(true);
      }
      expect(limiter.tryConsume("a")).toBe(false);
    });

    it("does not consume allowance once the caller is over the limit", () => {
      const limiter = new FixedWindowLimiter(1, 60_000);
      limiter.tryConsume("a");

      // Hammering a denied key must not push its reset further out; the
      // window has to expire on schedule or a blocked caller never recovers.
      for (let i = 0; i < 10; i++) expect(limiter.tryConsume("a")).toBe(false);

      vi.advanceTimersByTime(60_001);
      expect(limiter.tryConsume("a")).toBe(true);
    });

    it("keeps separate allowances per key", () => {
      const limiter = new FixedWindowLimiter(1, 60_000);

      expect(limiter.tryConsume("a")).toBe(true);
      expect(limiter.tryConsume("b")).toBe(true);
      expect(limiter.tryConsume("a")).toBe(false);
      expect(limiter.tryConsume("b")).toBe(false);
    });

    it("refills after the window elapses", () => {
      const limiter = new FixedWindowLimiter(2, 60_000);
      limiter.tryConsume("a");
      limiter.tryConsume("a");
      expect(limiter.tryConsume("a")).toBe(false);

      vi.advanceTimersByTime(59_999);
      expect(limiter.tryConsume("a")).toBe(false);

      vi.advanceTimersByTime(2);
      expect(limiter.tryConsume("a")).toBe(true);
    });
  });

  describe("isLimited / record", () => {
    it("reports limited only once `max` hits are recorded", () => {
      const limiter = new FixedWindowLimiter(3, 60_000);

      expect(limiter.isLimited("a")).toBe(false);
      limiter.record("a");
      limiter.record("a");
      expect(limiter.isLimited("a")).toBe(false);
      limiter.record("a");
      expect(limiter.isLimited("a")).toBe(true);
    });

    it("isLimited does not itself consume allowance", () => {
      const limiter = new FixedWindowLimiter(1, 60_000);

      expect(limiter.isLimited("a")).toBe(false);
      expect(limiter.isLimited("a")).toBe(false);
      expect(limiter.tryConsume("a")).toBe(true);
    });

    it("starts a fresh window rather than resurrecting an expired one", () => {
      const limiter = new FixedWindowLimiter(2, 60_000);
      limiter.record("a");
      limiter.record("a");
      expect(limiter.isLimited("a")).toBe(true);

      vi.advanceTimersByTime(60_001);
      limiter.record("a");
      expect(limiter.isLimited("a")).toBe(false);
    });
  });

  it("prunes expired buckets instead of growing without bound", () => {
    const limiter = new FixedWindowLimiter(1, 60_000);

    // Fill past the prune threshold with keys that will all go stale.
    for (let i = 0; i < 1000; i++) limiter.record(`old-${i}`);
    vi.advanceTimersByTime(60_001);

    // The next write is what triggers the sweep.
    limiter.record("fresh");

    const buckets = (limiter as unknown as { buckets: Map<string, unknown> })
      .buckets;
    expect(buckets.size).toBe(1);
    expect(buckets.has("fresh")).toBe(true);
  });

  it("keeps live buckets when pruning", () => {
    const limiter = new FixedWindowLimiter(1, 60_000);

    for (let i = 0; i < 999; i++) limiter.record(`old-${i}`);
    vi.advanceTimersByTime(30_000);
    limiter.record("half-way"); // still live when the sweep runs
    vi.advanceTimersByTime(30_001); // the 999 are now stale, "half-way" is not

    limiter.record("fresh");

    const buckets = (limiter as unknown as { buckets: Map<string, unknown> })
      .buckets;
    expect(buckets.has("half-way")).toBe(true);
    expect(buckets.has("fresh")).toBe(true);
    expect(buckets.size).toBe(2);
  });
});
