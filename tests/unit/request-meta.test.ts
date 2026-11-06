import { describe, expect, it } from "vitest";
import { clientIpFromHeaders } from "@/lib/request-meta";

describe("clientIpFromHeaders", () => {
  it("uses the entry our proxy appended, ignoring client-supplied ones", () => {
    // Attacker sends "X-Forwarded-For: 1.2.3.4"; nginx appends the real address.
    expect(clientIpFromHeaders("1.2.3.4, 203.0.113.7", null, 1)).toBe("203.0.113.7");
  });

  it("supports more than one trusted proxy", () => {
    expect(clientIpFromHeaders("1.2.3.4, 203.0.113.7, 10.0.0.2", null, 2)).toBe("203.0.113.7");
  });

  it("falls back to X-Real-IP, then a constant", () => {
    expect(clientIpFromHeaders(null, "198.51.100.4", 1)).toBe("198.51.100.4");
    expect(clientIpFromHeaders("", null, 1)).toBe("unknown");
  });

  it("uses the only entry when the chain is shorter than the hop count", () => {
    expect(clientIpFromHeaders("203.0.113.7", null, 2)).toBe("203.0.113.7");
  });
});
