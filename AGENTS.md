# ORES Chat public-site instructions

- This is the public Astro marketing site and compiled component distribution
  origin. Private component source belongs in the corresponding private repo.
- Do not add React, React DOM, JSX, TSX, Next.js, or React-compatible wrappers.
- Serve only reviewed Flutter web, WebAssembly, and framework-neutral HTML
  artifacts with checksums and source provenance.
- The public chat page must use a configured HTTPS API origin. Never embed
  provider tokens, service credentials, cookies, database URLs, or secrets.
- Preserve anonymous, invalid, and temporarily unavailable states as distinct
  UI outcomes. Do not claim the backend is live when it is not configured.
- Keep GitHub Pages output static, responsive, keyboard accessible, and usable
  without client-side enhancement.
- Use feature branches and pull requests. Never rebase, force-push, stash, or
  reset shared work.
