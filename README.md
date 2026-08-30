# ORES Chat

Public Astro marketing site and distribution origin for compiled ORES Chat
Flutter web, WebAssembly, and framework-neutral HTML component bundles.

Private component source remains in the `ores-chat` organization. This public
repository contains only reviewed distributable artifacts and public site
content.

## Component distribution

Versioned browser artifacts are served from `/components/<version>/` with a
SHA-256 checksum, machine-readable manifest, source repository, exact source
commit, and source pull request. The initial public URL is:

```text
https://ores-chat.github.io/components/v1/ores-chat-footer-link.js
```

The artifact is a standards-based ES module and custom element. It has no
React, JSX, TSX, or framework runtime dependency. Consumer markup keeps a real
fallback anchor so the footer link still works when JavaScript or the remote
module is unavailable.

## Public chat configuration

The `/chat/` page enables dialog mode only when the build receives a valid
`PUBLIC_ORES_CHAT_API_BASE`. Production values must use HTTPS. An absent or
invalid API origin renders an honest unavailable state instead of simulating a
chat response or sending data to an unreviewed endpoint.

Run `npm run check` to test the source policy and build, then verify the copied
artifact checksum and provenance against the private source repository.
