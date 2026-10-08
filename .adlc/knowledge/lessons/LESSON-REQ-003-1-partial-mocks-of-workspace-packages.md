# Mock workspace packages partially — keep AppError, DTOs and validators real ^L-REQ-003-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-003-1 |
| Captured | 2026-10-06 |
| REQ | REQ-003 |
| Component | backend |
| Tags | backend, testing, vitest |
| Severity | trap |

## The lesson

In backend tests, mock `@alumni/businesslogic` or `@alumni/dal` with a `vi.mock(..., async (importOriginal) => ({ ...(await importOriginal()), X: fake }))` factory that swaps only the class under test. Never use a bare automock: it fakes `AppError` (so `instanceof` fails and errors become 500s), DTO constructors (rows come out empty) and pure `validate*` methods (controllers throw).

## Saw it in

- `packages/backend/src/api/routes/routes.test.ts` — managers faked, `AppError` and `validate*` kept real
- `packages/backend/src/businessLogic/src/AlumniManager.test.ts` — automocked `AlumniDTO` produced empty rows
- `packages/backend/src/api/health.test.ts` — the one bare automock, harmless only because nothing there throws
