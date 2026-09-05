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

## Repository-local Git worktrees

- Create or use a Git worktree only when the human operator explicitly authorizes it for the current task. Concurrency or a dirty checkout is not permission by itself.
- Put every authorized worktree at `<repository-root>/tmp/worktrees/<name>`; from the repository root, use `./tmp/worktrees/<name>`. Never place worktrees beside repositories or organization directories.
- Keep `tmp`, `temp`, `tmp/worktrees`, and `temp/worktrees` ignored in the repository-root `.gitignore`. Do not commit files from those directories.
- Relocate or remove a worktree only when the operator explicitly requests it. Before removal, preserve and publish intended changes, verify its commit is represented on the target branch, and confirm there are no tracked, untracked, ignored-sensitive, or in-use files that must survive. Remove it with `git worktree remove <path>` without `--force`; never delete a worktree directory with `rm`.
