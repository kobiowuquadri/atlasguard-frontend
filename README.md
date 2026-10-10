# AtlasGuard dashboard

The web dashboard for **AtlasGuard — Engineering Trust in Nigerian AI**: evaluate N-ATLaS
across Nigerian English, Yoruba, Hausa and Igbo, inspect every response, and detect
cross-language inconsistencies. The API, evaluation engine, SDK and documentation live in
the backend repository, [atlasguard-backend](https://github.com/kobiowuquadri/atlasguard-backend).

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Radix-based
shadcn-style components, TanStack Query, React Hook Form + Zod, Recharts, Lucide, Playwright.

## Run locally

```bash
pnpm install
cp .env.example .env.local     # ATLASGUARD_API_URL=http://localhost:4000
pnpm dev                       # http://localhost:3000
```

The browser only calls `/api/*` on this origin; `next.config.ts` proxies those requests to
`ATLASGUARD_API_URL`, so the API's HTTP-only session cookie is first-party and the API URL is
never exposed to client code. `src/proxy.ts` redirects signed-out visitors away from
dashboard routes (the API still authorises every request).

| Script | |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | develop / production build / serve |
| `pnpm typecheck` | TypeScript |
| `pnpm test:e2e` | Playwright critical flows (needs the API running with development fixtures enabled; set `E2E_SCREENSHOTS=dir` to save screenshots) |

## Pages

Overview (with first-run onboarding) · Projects · Benchmarks (cases, provenance, review,
import/export) · Evaluations (step-by-step run setup, live progress, per-case results,
cross-language comparison, provenance) · Language insights · Reports (exports, run
comparison, integration evidence) · Developer API (keys, SDK and REST examples) · Settings
(profile, N-ATLaS connection, licence) · Beta feedback.

All numbers come from the API's stored records. Simulated fixture runs are labelled
*Simulated* everywhere and excluded from dashboard metrics unless you opt in.

## Deploy (Vercel)

Set `ATLASGUARD_API_URL` (your API's public URL) and `SESSION_COOKIE_NAME` (`ag_session`),
deploy, then add the Vercel origin to the API's `APP_ORIGINS`.

*N-ATLaS is an initiative of the Federal Ministry of Communications, Innovation and Digital
Economy, and powered by Awarri Technologies.* MIT licensed (AtlasGuard code only).
