import { describe, it, expect } from "vitest";
import { authorize, bearerToken, getHeader, safeEqual, resolveAuth, type ResolveDeps } from "../src/auth.js";
import { hashKeySecret } from "@docket/core";

describe("getHeader", () => {
  it("reads from a plain object (lowercased keys)", () => {
    expect(getHeader({ authorization: "Bearer abc" }, "authorization")).toBe("Bearer abc");
  });

  it("reads from a Headers instance", () => {
    const h = new Headers({ authorization: "Bearer xyz" });
    expect(getHeader(h, "authorization")).toBe("Bearer xyz");
  });

  it("returns null when missing", () => {
    expect(getHeader({}, "authorization")).toBeNull();
  });
});

describe("bearerToken", () => {
  it("extracts a bearer token", () => {
    expect(bearerToken({ authorization: "Bearer my-secret" })).toBe("my-secret");
  });

  it("is case-insensitive on the scheme", () => {
    expect(bearerToken({ authorization: "bearer tok" })).toBe("tok");
  });

  it("returns null when not a bearer scheme", () => {
    expect(bearerToken({ authorization: "Basic dXNlcjpwYXNz" })).toBeNull();
  });

  it("returns null when absent", () => {
    expect(bearerToken({})).toBeNull();
  });
});

describe("safeEqual", () => {
  it("is true for identical strings", () => {
    expect(safeEqual("alpha", "alpha")).toBe(true);
  });
  it("is false for different strings", () => {
    expect(safeEqual("alpha", "beta")).toBe(false);
  });
  it("is false for different lengths", () => {
    expect(safeEqual("a", "abc")).toBe(false);
  });
});

describe("authorize", () => {
  const KEY = "test-key";

  it("allows the correct bearer token", () => {
    expect(authorize({ authorization: `Bearer ${KEY}` }, KEY)).toBe(true);
  });

  it("rejects a wrong token", () => {
    expect(authorize({ authorization: "Bearer wrong" }, KEY)).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(authorize({}, KEY)).toBe(false);
  });

  it("rejects a non-bearer scheme", () => {
    expect(authorize({ authorization: "Basic abc" }, KEY)).toBe(false);
  });

  it("refuses everything when the server key is unset (fail-closed)", () => {
    expect(authorize({ authorization: `Bearer ${KEY}` }, undefined)).toBe(false);
  });
});

describe("resolveAuth", () => {
  const ADMIN = "admin-master-key";
  const PUB = "public-master-key";
  const ISSUED = "dk_issuedsecret1234567890abcdefghij";

  // Fake access store keyed by sha256 hash — mirrors the real DB lookup.
  // resolveAuth only touches findKeyByHash, so a partial object stands in.
  const fakeAccess = {
    findKeyByHash: async (hash: string) =>
      hash === hashKeySecret(ISSUED)
        ? { id: "key-1", owner: "a@b.com", scopes: ["read", "write"], revoked: false }
        : null,
  } as unknown as ResolveDeps["access"];

  const deps: ResolveDeps = {
    access: fakeAccess,
    adminMasterKey: ADMIN,
    publicMasterKey: PUB,
  };

  it("resolves the admin master key to full scopes", async () => {
    const r = await resolveAuth({ authorization: `Bearer ${ADMIN}` }, deps);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.scopes).toEqual(["read", "write", "admin"]);
      expect(r.keyId).toBeNull();
      expect(r.origin).toBe("master-admin");
    }
  });

  it("resolves the public master key to read+write", async () => {
    const r = await resolveAuth({ authorization: `Bearer ${PUB}` }, deps);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.scopes).toEqual(["read", "write"]);
      expect(r.origin).toBe("master-public");
    }
  });

  it("resolves an issued key to its own scopes", async () => {
    const r = await resolveAuth({ authorization: `Bearer ${ISSUED}` }, deps);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.scopes).toEqual(["read", "write"]);
      expect(r.keyId).toBe("key-1");
      expect(r.origin).toBe("key");
    }
  });

  it("fail-closes on an unknown token", async () => {
    const r = await resolveAuth({ authorization: "Bearer wrong-token" }, deps);
    expect(r.ok).toBe(false);
  });

  it("fail-closes on a missing header", async () => {
    const r = await resolveAuth({}, deps);
    expect(r.ok).toBe(false);
  });
});

