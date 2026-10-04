# Architecture Overview

High-level shape of the system. Updated when major architectural changes land (usually as part of an ADR).

## What this project is

> **STATUS: needs verification** — synthesized from `README.md` on 2026-10-04. The README is a folder tree only; roles below are read from folder and file names. Review and edit; remove this banner when confirmed.

alumni-system: an alumni network for universities — sign-up, profiles, a directory, posts and comments. See [[context/project-overview]].

## System diagram

> **STATUS: needs verification** — synthesized from `README.md` on 2026-10-04. The README is a folder tree only; roles below are read from folder and file names. Review and edit; remove this banner when confirmed.

```
packages/frontend (React + Vite)
        │  HTTP (services/authApi.ts)
        ▼
packages/backend/src/api        Express: routes → Middleware (auth, role) → controllers
        ▼
packages/backend/src/businessLogic   *Manager classes
        ▼
packages/backend/src/dal        query/*Query.ts, dto/*DTO.ts, config/db.ts
        ▼
PostgreSQL

packages/shared — TypeScript types (alumni, comment, post, user) used across packages
```

## Major components

> **STATUS: needs verification** — synthesized from `README.md` on 2026-10-04. The README is a folder tree only; roles below are read from folder and file names. Review and edit; remove this banner when confirmed.

| Component | Responsibility | Tech |
|---|---|---|
| `packages/frontend` | UI: pages (Login, Dashboard), components, API service calls | React 18, Vite, react-router |
| `packages/backend/src/api` | HTTP layer: routes (Alumni, Auth, Comment, Post, User), controllers, auth + role middleware | Express |
| `packages/backend/src/businessLogic` | Business rules: AlumniManager, CommentManager, PostManager, UserManager | TypeScript |
| `packages/backend/src/dal` | Data access: SQL query modules, DTOs, DB connection config | `pg` |
| `packages/shared` | Shared domain types | TypeScript |

## Data stores

> **STATUS: needs verification** — synthesized from `README.md` on 2026-10-04. The README is a folder tree only; roles below are read from folder and file names. Review and edit; remove this banner when confirmed.

| Store | Holds | Tech |
|---|---|---|
| PostgreSQL | Users, alumni profiles, posts, comments (per DTO/query names) | PostgreSQL via `pg` |

## External integrations

| Integration | Purpose | Direction |
|---|---|---|
| _(empty)_ | | inbound \| outbound \| both |

## Layering rules

How code is organized. What can call what. Where boundaries are.

> **STATUS: needs verification** — synthesized from `README.md` on 2026-10-04. The README is a folder tree only; roles below are read from folder and file names. Review and edit; remove this banner when confirmed.

- api → businessLogic → dal → database, judging by folder structure. Whether api may call dal directly is not documented — confirm.
- Shared types live in `packages/shared`.

## Cross-cutting concerns

How auth, logging, error handling, config, observability, and other cross-cutting concerns are handled.

## Related ADRs

_(populated as ADRs land)_
