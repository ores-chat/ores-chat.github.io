import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname } from "node:path";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("uses no React-family runtime or JSX/TSX source", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const dependencyNames = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  });
  assert.deepEqual(
    dependencyNames.filter((name) => /^(?:react|react-dom|next|preact)(?:$|\/)/i.test(name)),
    [],
  );

  const sourceFiles = await readdir(new URL("../src/", import.meta.url), { recursive: true });
  assert.deepEqual(
    sourceFiles.filter((path) => [".jsx", ".tsx"].includes(extname(path))),
    [],
  );
});

test("keeps the site-wide ORES Chat entry point in the footer", async () => {
  const layout = await read("src/layouts/Base.astro");
  const footer = layout.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? "";
  assert.match(footer, /<ores-chat-footer-link/);
  assert.match(footer, /href="\/chat\/\?context=ores-chat-marketing"/);
  assert.doesNotMatch(layout.slice(0, layout.indexOf("<footer")), /<ores-chat-footer-link/);
});

test("distributes a provider-neutral custom-element artifact with provenance", async () => {
  const [artifact, manifestText, provenanceText] = await Promise.all([
    read("public/components/v1/ores-chat-footer-link.js"),
    read("public/components/v1/manifest.json"),
    read("public/components/v1/provenance.json"),
  ]);
  const manifest = JSON.parse(manifestText);
  const provenance = JSON.parse(provenanceText);

  assert.match(artifact, /customElements\.define\("ores-chat-footer-link"/);
  assert.match(artifact, /v1\/public\/chat/);
  assert.match(artifact, /protocol: PROTOCOL_VERSION/);
  assert.match(artifact, /credentials: "omit"/);
  assert.match(artifact, /"x-ores-chat-site": contextId/);
  assert.doesNotMatch(artifact, /headers:[\s\S]{0,500}authorization/i);
  assert.deepEqual(manifest.artifacts[0].surfaces, ["html", "custom-element"]);
  assert.equal(provenance.sha256, manifest.artifacts[0].sha256);
  assert.equal(
    provenance.source_pull_request,
    "https://github.com/ores-chat/ores-chat-external-components/pull/2",
  );
});
