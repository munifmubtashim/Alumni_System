# Project Overview

The plain-English what-and-why of this project. Read by every Claude session so context doesn't have to be re-derived.

## What this is

> **STATUS: needs verification** — synthesized from `README.md` and the answers given at `/init` on 2026-10-04. The README is only a folder tree, so this description comes from the init answers. Review and edit; remove this banner when confirmed.

alumni-system is an alumni network for universities. Students and alumni sign up, keep profiles, browse a directory, and post and comment.

It is a TypeScript monorepo (npm workspaces) with an Express API, a React frontend, and a shared types package (layout per `README.md`).

## Who uses it

> **STATUS: needs verification** — synthesized from the answers given at `/init` on 2026-10-04.

Students and alumni of a university. Admins also exist (a role check lives in `packages/backend/src/api/Middleware/roleMiddleware.ts`).

## Core flows

> **STATUS: needs verification** — synthesized from the answers given at `/init` on 2026-10-04 and controller names in `README.md`.

1. Sign up / log in (university + student sign-up; auth routes)
2. Keep and edit a profile; browse the alumni directory
3. Post and comment

## Stack snapshot

> **STATUS: needs verification** — synthesized from `README.md`, `package.json` files, and the stack confirmed at `/init` on 2026-10-04.

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript + react-router (`packages/frontend`) |
| Backend | Node + Express, TypeScript, layered api → businessLogic → dal (`packages/backend`) |
| Shared | Shared TypeScript types (`packages/shared`) |
| Database | PostgreSQL via `pg` |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` password hashing |
| Deploy | _(not documented)_ |

## What this project is **not**

Out-of-scope adjacencies. Worth listing because they recur as suggestions.

## Constraints

Hard constraints that shape every decision.

- _(e.g., "Backend API contract is frozen — only the frontend changes")_
- _(e.g., "Legacy code at D:/old is read-only")_
- _(e.g., "Must support IE 11 until 2027")_

## Status

| Field | Value |
|---|---|
| Phase | building |
| Started | 2026-10-04 |
| Repo | /Users/munifmubtashim/Alumni_System |
