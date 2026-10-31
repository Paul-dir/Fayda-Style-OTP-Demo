# Fayda-Style OTP Demo

A prototype showing a fictional identity-ID and one-time-code login flow; it is not an official Fayda service and does not verify real identities.

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

- `artifacts/fayda-otp-demo/` — single-page demo experience and client integration
- `artifacts/api-server/src/routes/mock-auth.ts` — mock verification HTTP endpoints
- `artifacts/api-server/src/lib/identity-verification-provider.ts` — provider interface for future authorized integrations
- `artifacts/api-server/src/lib/mock-identity-verification-provider.ts` — fictional identities and simulated OTP implementation
- `lib/api-spec/openapi.yaml` — API source of truth; regenerate clients with the command above

## Architecture decisions

- The current provider is mock-only: it uses fictional IDs, keeps challenge state in memory, and sends no SMS.
- The mock OTP is returned only to make the prototype testable. Never expose a code from a real identity provider.
- Keep any future real provider behind the provider interface and connect only after official authorization and partner API access; do not use this demo to query or enumerate Fayda records.

## Product

- Enter one of the fictional demo IDs, request a simulated OTP, and complete a mock verification.
- Demo values are temporary and are not saved to local storage or a database.
- The successful screen represents a prototype state only, not proof of identity or a real authenticated session.

## User preferences

- Start with a working mock OTP flow; consider a real Fayda integration only after authorized API access is available.

## Gotchas

- Mock challenges are in-memory and are cleared when the API process restarts.
- The demo code appears in the UI for testing; this is specific to the mock flow and must not carry over to a live provider.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
