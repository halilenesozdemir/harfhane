# Monthly engineering-standards note — 2026-11

Run date 2026-11-01. This is the first monthly note. The previous baseline is
`docs/research/2026-10-06-engineering-standards.md`, and most of its proposals have landed (axe,
fast-check, Stryker, knip, dependency-cruiser, flaky-test policy, AC traceability). No PR from an
earlier monthly run was open on this date.

Method: `npm view <pkg> version` against the public registry for "latest" (2026-11-01);
`pnpm-lock.yaml` for the resolved versions; `pnpm audit --json` against the lockfile
(4 critical, 106 high, 140 moderate, 32 low, mostly dev/transitive). Advisory links are the
GitHub Advisory Database URLs that `pnpm audit` returned. `developers.cloudflare.com` could not be
fetched from this session (blocked by the network policy), so Cloudflare claims below come from
search results and are marked as such.

## Dependencies

### Runtime code that ships to players (fix first)

| Package (where) | Resolved | Latest | Issue | Source |
| --- | --- | --- | --- | --- |
| `hono` (backend) | 4.12.5 | 4.13.16 | 33 advisories, fixed between 4.12.7 and 4.13.11. The ones that apply to our code: CORS ReDoS via `Access-Control-Request-Headers` (fixed in 4.12.34) and the `__proto__` prototype pollution (4.12.7). The high "CORS reflects any Origin" advisory covers the *default* `origin`; we pass an explicit allow-list function (`apps/backend/src/index.ts:19-36`), so it probably does not apply (unverified). JSX, serveStatic, Lambda and SSG advisories do not apply (we import only `hono/cors` and `hono/factory`) | https://github.com/advisories/GHSA-8j4g-w8fx-2239, https://github.com/advisories/GHSA-v8w9-8mx6-g223, https://github.com/advisories/GHSA-88fw-hqm2-52qc |
| `react-router-dom` / `react-router` (frontend) | 7.13.1 | 7.18.5 | 12 advisories, 6 high, all fixed by 7.18.2. Most target RSC/framework mode, which we do not use (unverified). The ones that hit library mode too: open redirect via backslash in `<Link>`/`useNavigate` and the route-matching DoS | https://github.com/advisories/GHSA-wrjc-x8rr-h8h6, https://github.com/advisories/GHSA-chx6-hx7r-mcp5 |
| `zod` (backend) | 3.25.76 | 4.6.7 | High: memory exhaustion validating oversized constrained collections. The patch is `>=4.6.6` only, so v3 has no fix; leaving it means a major migration (with `@hono/zod-validator` 0.4 → 0.9, whose peer range is `zod ^3.25 \|\| ^4`) | https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 |
| `@tanstack/react-query`, `lucide-react` (frontend) | 5.90 / 0.562 | 5.105 / 1.66 | No advisories. `lucide-react` went 0.x → 1.x (a major) | registry |
| `react`, `react-dom` | 19.2.3/19.2.4 | 19.3.1 | Minor behind, no advisory in the audit | registry |

### Toolchain (dev-only, but runs in CI and on agent machines)

| Package | Resolved | Latest | Note | Source |
| --- | --- | --- | --- | --- |
| `vitest` (all) | 3.2.4 | 5.0.5 | Critical: arbitrary file read when the Vitest UI server listens; fixed in 3.2.6 (3.2.7 is out). We never run `--ui`, so exposure is low, but a patch bump inside 3.x clears it. Vitest 5 (Sept 2026) changed config lookup (no ancestor configs) and `clearMocks` defaults | https://github.com/advisories/GHSA-5xrq-8626-4rwp, https://blog.openreplay.com/vitest-5-changes/ |
| `tinypool` (via vitest) | <2.1.2 | — | Two critical prototype-pollution advisories, cleared with the vitest bump | https://github.com/advisories/GHSA-85c8-ppgw-ccpr |
| `@cloudflare/vitest-pool-workers` (backend) | 0.8.x | 0.23.0 | **Deprecated**: the registry says it was renamed to `@cloudflare/vitest-plugin` (1.4.11) and gets no more updates. Vitest 4 support came in 0.13; 0.12 was the last for Vitest 3. `@cloudflare/vitest-plugin` needs `vitest ^4.1 \|\| ^5`. This pins the backend (and so the repo) to Vitest 3 | registry `deprecated` field; https://github.com/cloudflare/workers-sdk/releases/tag/@cloudflare%2Fvitest-plugin@1.0.0; https://developers.cloudflare.com/workers/testing/vitest-integration/migration-guides/migrate-to-vitest-plugin/ (search result, not fetched) |
| `wrangler` (backend) | 4.35.0 / 4.71.0 | 4.156.0 | High: OS command injection in `wrangler pages`, fixed in 4.59.1. `deploy-frontend.yml` runs `pages deploy` through `cloudflare/wrangler-action@v3`; which wrangler version that action resolves is unverified | https://github.com/advisories/GHSA-36p8-mvp6-cv38 |
| `vite` (frontend) | 7.3.1 | 8.3.5 | High dev-server advisories (fs.deny bypass, arbitrary file read), fixed in 7.3.2/7.3.7. Vite 8 uses Rolldown; `vite-plugin-pwa` 2.0 accepts `vite ^7 \|\| ^8`, so it does not block | https://github.com/advisories/GHSA-p9ff-h696-f583, https://vite.dev/blog/announcing-vite8-beta, `npm view vite-plugin-pwa@2.0.0 peerDependencies` |
| `typescript` | 5.9.3 / 6.0.3 (mobile) | 7.0.2 | TS 7 is the Go-native compiler (8-12x faster) but has no stable programmatic API until 7.1, so typescript-eslint cannot use it yet. Skip for now; the route is 6.0 first | https://infoq.com/news/2026/08/typescript-7-released/ |
| `eslint` | 9.39 | 10.14 | Major behind; no advisory | registry |
| `tailwindcss` | 3.4.19 | 4.3.3 | Major; already planned as Plan 002 U9, after release (roadmap) | `docs/roadmap.md` |
| `jsdom` | 29.0.1 | 30.1.3 | Major behind | registry |
| `@playwright/test`, `@axe-core/playwright` | 1.63 / 4.13 | 1.64.1 / 4.14.0 | Minor behind, current enough | registry |
| `knip`, `dependency-cruiser`, `@stryker-mutator/*` | 6.40 / 18.5 / 10.0.0 (exact pins) | 6.44.1 / 18.7.0 / 10.1.1 | Minor behind, exact pins on purpose | registry |
| `pnpm` (`packageManager`) | 9.0.0 | 12.16.1 | Three majors behind; CI uses `pnpm/action-setup@v4`, which reads this field | registry |
| `sharp` | 0.35.5 | 0.35.5 | Current; the three libvips/libheif/librsvg advisories are fixed in 0.35.5, so they show up only through stale transitive copies | https://github.com/advisories/GHSA-wq5f-xc86-pv6w |
| Transitive: `undici` (35), `brace-expansion`, `fast-uri`, `node-forge`, `devalue`, `postcss`, `serialize-javascript` (via `vite-plugin-pwa` → `workbox-build`) | — | — | Dev/build-time only; most clear with the wrangler, vitest and vite bumps. `node-forge` has an advisory with no patched version (GHSA-86w9-cpqp-85rv) | `pnpm audit` |

### Mobile

| Package | Resolved | Latest | Note | Source |
| --- | --- | --- | --- | --- |
| `expo` + `expo-*`, `jest-expo` | 57.0.x | 58.0.x | SDK 58 brings React Native 0.88, R8 on by default in Android release builds, and the `balanced` fingerprint preset. Upgrade with `npx expo install expo@^58.0.0 --fix` and then `npx expo-doctor`. No first EAS build exists yet (Phase 4), so upgrading before it is cheaper than after (opinion) | https://expo.dev/changelog/sdk-58, https://expo.dev/blog/how-to-upgrade-to-sdk-58 |
| `react-native` | 0.86.3 | 0.88.1 | Follows the Expo SDK; do not bump on its own | same |
| `@react-native-async-storage/async-storage` | 2.2.0 | 3.1.1 | Major; take the version `expo install` picks for SDK 58 | registry |
| `jest` / `@types/jest` | 29.7 / 29.5.14 | 30.5.2 / 30.0.0 | Follows `jest-expo` | registry |
| `lucide-react-native`, `react-native-svg`, `react-native-safe-area-context` | 1.52 / 15.15.4 / 5.7 | 1.66 / 15.16 / 5.11 | Minor behind; follow `expo install` | registry |

### Python (`scripts/words/requirements.txt`)

| Package | Pinned | Latest | Note | Source |
| --- | --- | --- | --- | --- |
| `wordfreq` | 3.1.1 | 3.1.1 | Current, but the data is **frozen**: "the data is unlikely to be updated again". Code is Apache-2.0; some data files are CC BY-SA 4.0. We use it only as an internal ranking signal and store no frequency values, which matches the 2026-10-06 word-supply note | https://github.com/rspeer/wordfreq |

## New tools

| Tool | Recommendation | Why | Source |
| --- | --- | --- | --- |
| `@cloudflare/vitest-plugin` | **Add (as a replacement)** when the repo moves to Vitest 4/5 | Its predecessor is deprecated; Cloudflare ships a codemod (`npx @cloudflare/codemods vitest:pool-workers-to-vitest-plugin`) | https://developers.cloudflare.com/changelog/post/2026-08-19-vitest-plugin/ (search result) |
| TypeScript 7 (native) | **Skip** until 7.1's API and typescript-eslint support it | Faster typecheck would shorten the commit gate, but lint tooling cannot use it yet | https://infoq.com/news/2026/08/typescript-7-released/ |
| Vite 8 (Rolldown) | **Skip until after release**, together with Tailwind 4 | Build speed only; patching to 7.3.7 clears the advisories | https://vite.dev/blog/announcing-vite8-beta |
| Hono 4.13 features (`app.query()`, Method Not Allowed middleware) | **Keep** current usage; the bump is for security, not features | 4.13.3 also fixes CORS `Vary` on preflight | https://releasebot.io/updates/hono |
| D1 free-tier enforcement | **Check** (owner) | A Cloudflare changelog preview says D1 queries on the Workers Free plan fail after the daily row read/write cap, from 2026-09-01. If production runs on the Free plan, a busy day could break the daily word. Plan tier unverified | https://13213614.previews.developers.cloudflare.com/changelog/ (preview domain, unverified) |
| Turkish word lists: `turkish-wordlist` (npm, MIT port of `mertemin/turkish-word-list`) | **Skip** | The upstream list is drawn from TDK data (Invariant 3) (unverified in this run; same lineage as `bilalozdemir/tr-word-list`, which states TDK) | https://npmjs.com/package/turkish-wordlist, https://github.com/bilalozdemir/tr-word-list |
| `hermitdave/FrequencyWords` | **Skip** | MIT code, but the lists come from OpenSubtitles, and the 2026-10-06 note records OpenSubtitles-based lists as CC BY-SA | https://awesome.ecosyste.ms/projects/github.com%2Fhermitdave%2FFrequencyWords |
| Leipzig Corpora Collection (Turkish) | **Investigate, do not import** | Sources disagree: CC BY 4.0 per Wiktionary and a Danish portal, but the download page refers to its own terms and other Leipzig data is CC BY-NC. Read the per-file licence first | https://wortschatz.uni-leipzig.de/en/download, https://en.wiktionary.com/wiki/Wiktionary:Frequency_lists/Turkish |
| News-based Turkish frequency dictionary (Zeyrek lemmatizer) | **Skip for now** | Licence not stated | https://frequency-dictionary.pages.dev/about.html |
| Accessibility | **Keep** axe on Playwright (4.14 available) | No new tool found this month that beats the current setup (unverified: no dedicated search for React Native a11y linters) | registry |

## Reference repos

| Repo | License | What to copy | Source |
| --- | --- | --- | --- |
| `honojs/examples` | MIT | `pages-stack` (zod + zod-validator + `hc` client + React) is the closest official shape to proposal #6 of the 2026-10-06 note (Hono RPC client), which is still not done. No D1 or testing example | https://github.com/honojs/examples |
| `zigcccc/petka-app` (Slovenian daily word game, Expo + pnpm) | **No licence found**, so reading only | Uses `eas.json`, Jest, Biome, Husky and Sonar, plus `.claude/skills` like ours. Nothing to copy that we lack, except that its EAS config exists before launch | https://github.com/zigcccc/petka-app |
| `EternityDoom/react-native-wordle` | MIT | Bare React Native (not Expo) and the name uses the trademark (Invariant 6); low value | https://github.com/EternityDoom/react-native-wordle |
| `angelolz1/CS402-Wordbites` | GPL-3.0 | Do not reuse code (copyleft) | https://github.com/angelolz1/CS402-Wordbites |

Like last month, the search found no well-maintained, well-tested Expo word game or Hono + D1
flagship repo. Cloudflare's own `workers-sdk` fixtures remain the best Workers reference
(unverified this run).

## Proposals

At most five, added to `docs/backlog.md` under "Monthly research 2026-11":

1. **High / Low**: in-range security bumps for the code that ships: `hono` → ^4.13.16 and
   `react-router-dom` → ^7.18.5, plus dev `vitest` 3.2.7, `vite` 7.3.7 and `wrangler` ≥4.59.1, then
   regenerate `pnpm-lock.yaml`. Files: `apps/backend/package.json`, `apps/frontend/package.json`,
   `pnpm-lock.yaml`.
2. **Medium / Medium**: backend `zod` 3 → 4 with `@hono/zod-validator` 0.9 (the zod advisory has no
   v3 fix). Files: `apps/backend/package.json`, `apps/backend/src/**` validators.
3. **Medium / Medium**: migrate the deprecated `@cloudflare/vitest-pool-workers` to
   `@cloudflare/vitest-plugin`. This needs Vitest 4+ in every workspace (one plan with one unit per
   workspace) and a bump of `compatibility_date` (2025-01-01) in `apps/backend/wrangler.toml`.
4. **Medium / Low**: no `.github/dependabot.yml` exists, although the 2026-10-06 note said "keep
   Dependabot". Add a monthly, grouped, security-focused config for npm, pip and github-actions with
   a low `open-pull-requests-limit`, because of the Actions-minutes budget.
5. **Medium / Low** (owner): confirm the Cloudflare plan tier and the D1 daily row caps against
   real traffic. Then upgrade Expo to SDK 58 before the first EAS build (Phase 4).
