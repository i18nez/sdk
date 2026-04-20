import { describe, expect, it } from "vitest";
import { hashText, clearHashCache } from "../src/hash";

describe("hashText", () => {
  it("produces hex-encoded SHA-256 of 64 chars", async () => {
    const hash = await hashText("hello");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces the canonical SHA-256 for 'hello'", async () => {
    const hash = await hashText("hello");
    expect(hash).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("produces different hashes for different input", async () => {
    const a = await hashText("foo");
    const b = await hashText("bar");
    expect(a).not.toBe(b);
  });

  it("handles unicode correctly", async () => {
    const hash = await hashText("日本語");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns cached result on repeated call", async () => {
    clearHashCache();
    const first = await hashText("cache-me");
    const second = await hashText("cache-me");
    expect(second).toBe(first);
  });
});
