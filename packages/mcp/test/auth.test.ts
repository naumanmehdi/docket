import { describe, it, expect } from "vitest";
import { authorize, bearerToken, getHeader, safeEqual } from "../src/auth.js";

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
