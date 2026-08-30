import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [indexHtml, chatHtml, artifact, checksumText, provenanceText] = await Promise.all([
  read("dist/index.html"),
  read("dist/chat/index.html"),
  read("dist/components/v1/ores-chat-footer-link.js"),
  read("dist/components/v1/ores-chat-footer-link.js.sha256"),
  read("dist/components/v1/provenance.json"),
]);

assert.match(indexHtml, /ores-chat-footer-link/);
assert.match(indexHtml, /\/components\/v1\/ores-chat-footer-link\.js/);
assert.match(chatHtml, /Public chat is not connected yet|mode="dialog"/);

const expectedDigest = checksumText.trim().split(/\s+/)[0];
const actualDigest = createHash("sha256").update(artifact).digest("hex");
assert.equal(actualDigest, expectedDigest, "distributed component checksum must match");

const provenance = JSON.parse(provenanceText);
assert.equal(provenance.artifact, "ores-chat-footer-link.js");
assert.equal(provenance.sha256, actualDigest);
assert.match(provenance.source_commit, /^[a-f0-9]{40}$/);
assert.equal(
  provenance.source_repository,
  "https://github.com/ores-chat/ores-chat-external-components",
);

console.log("verified public site, component distribution, checksum, and provenance");
