# Sugamya Setu

Sugamya Setu is a civic accessibility platform for checking building plans, publishing transparent audit records, and helping people navigate public buildings with confidence.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/sugamya-setu/src/App.tsx` — responsive dashboard, building detail, compliance checker, field inspection, wayfinding, and accessibility controls
- `artifacts/sugamya-setu/src/index.css` — civic visual language, responsive layout, keyboard focus states, high-contrast and inversion modes
- `artifacts/api-server/src/routes/buildings.ts` — public building register, dashboard summary, compliance records, and indoor wayfinding seed data
- `artifacts/api-server/src/routes/compliance.ts` — compliance rule engine and field audit submission endpoints
- `lib/api-spec/openapi.yaml` — source of truth for generated API hooks and validation schemas

## Architecture decisions

- The first release uses a small in-memory public register so the demo is immediately usable without external setup; the API shapes are ready to move into PostgreSQL-backed persistence.
- The compliance checker is intentionally deterministic and explainable: each gap maps to a reference and a concrete recommendation.
- Wayfinding is represented as accessible, selectable map checkpoints and a browser-native assistive camera mode, keeping the MVP useful without a third-party map key.
- Accessibility controls live in the shared shell so read-aloud, high contrast, and inversion are available on every route.

## Product

- Public directory with search, status filtering, star ratings, and audit freshness
- Transparent building records with AI-style compliance gaps and independent field reports
- Architect submission flow with blueprint attachment and rule-based checks
- Auditor field inspection submission flow
- Indoor wayfinding with checkpoint status and simulated assistive camera guidance
- Native browser read-aloud, high-contrast, and color inversion controls

## User preferences

No additional preferences recorded.

## Gotchas

- Use the generated API client from `@workspace/api-client-react` for frontend API access.
- The artifact workflow supplies `PORT` and `BASE_PATH`; use the managed workflow for preview and runtime checks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
