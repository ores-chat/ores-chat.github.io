import assert from "node:assert/strict";
import test from "node:test";
import { isTrustedPublicApiOrigin } from "../src/lib/public-api-origin.mjs";

test("accepts HTTPS origins and explicit loopback HTTP development origins", () => {
  for (const origin of [
    "https://chat.example.test",
    "https://chat.example.test:8443/",
    "http://localhost:3000",
    "http://127.0.0.1:8080/",
    "http://[::1]:9000",
  ]) {
    assert.equal(isTrustedPublicApiOrigin(origin), true, origin);
  }
});

test("rejects untrusted destinations and URL decorations", () => {
  for (const origin of [
    "", " ", "https://chat.example.test ", "https://u:p@chat.example.test",
    "https://chat.example.test/base", "https://chat.example.test/?site=other",
    "https://chat.example.test/#context", "https://chat.example.test/?",
    "http://chat.example.test", "http://localhost.example.test",
    "http://127.0.0.2:8080", "http://[::2]:3000", "http://0.0.0.0",
    "https://chat.example.test@evil.example.test/path", "javascript:alert(1)",
    "ftp://chat.example.test", "//chat.example.test", "not-a-url",
  ]) {
    assert.equal(isTrustedPublicApiOrigin(origin), false, origin);
  }
});

test("rejects non-string, oversized, and control-character values", () => {
  for (const value of [null, undefined, 123, {}, "https://x.test/" + "a".repeat(2050), "https://x.test\n"]) {
    assert.equal(isTrustedPublicApiOrigin(value), false);
  }
});
