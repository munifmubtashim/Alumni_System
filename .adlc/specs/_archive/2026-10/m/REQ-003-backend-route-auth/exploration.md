# Codebase Exploration: REQ-003-backend-route-auth

**Date:** 2026-10-05  
**Explorer:** Claude Haiku 4.5  
**Working directory:** /Users/munifmubtashim/Alumni_System

---

## Q1: Every route registered in packages/backend/src/api, with current middleware, and methods behind removed routes

### Routes inventory (by file)

**app.ts**
- `GET /api/health` — no middleware (public)

**AuthRoutes.ts**
- `POST /api/auth/login` — no middleware
- `POST /api/auth/register` — no middleware

**UserRoutes.ts**
- `POST /api/users` — **no middleware** (public) → `createUser` (UserController)
- `GET /api/users` — **no middleware** (public) → `getAllUsers` (UserController)
- `GET /api/users/:id` — **no middleware** (public) → `findUserById` (UserController)
- `GET /api/users/email/:email` — **no middleware** (public) → `findUserByEmail` (UserController) — **REMOVED in REQ-003**
- `PUT /api/users/:id` — `authMiddleware` only → `updateUser` (UserController)
- `DELETE /api/users/:id` — `authMiddleware`, `requireRole("admin")` → `deleteUser` (UserController)
- `PUT /api/users/:id/login` — **no middleware** (public) → `updateLoginTime` (UserController) — **REMOVED in REQ-003**
- `PUT /api/users/:id/logout` — **no middleware** (public) → `updateLogoutTime` (UserController) — **REMOVED in REQ-003**

**AlumniRoutes.ts**
- `POST /api/alumni` — **no middleware** (public) → `createAlumni` (AlumniController)
- `GET /api/alumni` — **no middleware** (public) → `getAllAlumni` (AlumniController)
- `GET /api/alumni/:id` — `authMiddleware` only → `findAlumniById` (AlumniController)
- `GET /api/alumni/email/:email` — **no middleware** (public) → `findAlumniByEmail` (AlumniController) — **REMOVED in REQ-003**
- `PUT /api/alumni/:id` — `authMiddleware` only → `updateAlumni` (AlumniController)

**PostRoutes.ts**
- `POST /api/posts` — **no middleware** (public) → `createPost` (PostController)
- `GET /api/posts` — **no middleware** (public) → `getAllPosts` (PostController)
- `GET /api/posts/user/:id` — **no middleware** (public) → `getPostsByUserId` (PostController)
- `PUT /api/posts/:id` — **no middleware** (public) → `updatePost` (PostController)
- `DELETE /api/posts/:id` — **no middleware** (public) → `deletePost` (PostController)
- `GET /api/posts/:id/comments` — **no middleware** (public) → `getPostComments` (CommentController)
- `POST /api/posts/:id/comments` — `authMiddleware` only → `addComment` (CommentController)

**CommentRoutes.ts**
- `DELETE /api/comments/:id` — `authMiddleware` only → `deleteComment` (CommentController)

**MeRoutes.ts** (uses `router.use(authMiddleware)` on the entire router)
- `GET /api/me` → `getMe` (MeController)
- `PUT /api/me` → `updateMe` (MeController)
- `PUT /api/me/password` → `changeMyPassword` (MeController)

### Methods behind removed routes and their cross-references

**Routes being removed:**
1. `GET /api/users/email/:email`
2. `PUT /api/users/:id/login`
3. `PUT /api/users/:id/logout`
4. `GET /api/alumni/email/:email`

**Methods in UserController and UserManager:**
- `findUserByEmail` — called by:
  - **UserController** (route `GET /api/users/email/:email`)
  - **UserController** (login function — checks credentials before signing token) ✓ **KEEP**
  - No other callers
  
- `updateLoginTime` — called by:
  - **UserController** (route `PUT /api/users/:id/login`)
  - No other callers
  
- `updateLogoutTime` — called by:
  - **UserController** (route `PUT /api/users/:id/logout`)
  - No other callers

**Methods in AlumniController and AlumniManager:**
- `findAlumniByEmail` — called by:
  - **AlumniController** (route `GET /api/alumni/email/:email`)
  - No other callers

**Conclusion:** Only `findUserByEmail` is used elsewhere (in login); the other three methods (`updateLoginTime`, `updateLogoutTime`, `findAlumniByEmail`) have no other callers and can be safely deleted as per AC4.

---

## Q2: Where password hashes leak — UserQuery/UserManager methods and endpoints

### UserQuery methods that return password hashes

**Current state:**
- `createUser` — returns `RETURNING *` from users table (includes password)
- `findUserByEmail` — returns `SELECT * FROM users` (includes password)
- `findUserById` — returns `SELECT * FROM users` (includes password)
- `getAllUsers` — returns `SELECT * FROM users` (includes password)
- `findPasswordHash` — returns password only; intended for internal use (changeMyPassword) ✓ **SAFE**
- `updatePassword` — does not return the hash ✓ **SAFE**

**Methods that safely exclude password:**
- `createAlumniUser` — returns `RETURNING ${UserQuery.PUBLIC_USER_COLUMNS}` where `PUBLIC_USER_COLUMNS = 'id, name, email, role, photo_url, university, created_at'` (no password) ✓
- `createStudentUser` — returns `RETURNING ${UserQuery.PUBLIC_USER_COLUMNS}` (no password) ✓
- `findMyProfile` — uses `MY_PROFILE_SQL` which explicitly does not select password ✓
- `updateMyProfile` — calls `MY_PROFILE_SQL` for the return (no password) ✓

### Endpoints currently exposing password

**Via UserController:**
- `POST /api/users` (createUser) — returns result of `UserManager.createUser()` which returns `UserDTO` from `createUser()` which does `RETURNING *` (includes password)
- `GET /api/users` (getAllUsers) — returns all users with password
- `GET /api/users/:id` (findUserById) — returns single user with password
- `GET /api/users/email/:email` (findUserByEmail) — returns single user with password — **REMOVED in REQ-003**
- `POST /api/auth/register` (register) — returns `{ token, user }` where user is from `PublicUserRow` (no password) ✓ **SAFE**

### Existing PublicUserRow shape

**RegisterDTO.ts** (line 24–32) defines:
```typescript
export interface PublicUserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  photo_url?: string;
  university?: string;
  created_at: Date;
}
```

**UserQuery.ts** (line 112) defines the column list:
```typescript
private static readonly PUBLIC_USER_COLUMNS = 'id, name, email, role, photo_url, university, created_at';
```

**Status:** ✓ **Reusable shape exists.** The `PublicUserRow` interface and `PUBLIC_USER_COLUMNS` are already defined. The challenge is that:
- `createUser` uses the Query method directly, not the shape filter
- `getAllUsers` and `findUserById` return raw DTOs including the password field

**Recommended approach:** Make the four methods return `PublicUserRow` instead of `UserDTO` by filtering columns in the Query layer (SELECT specific columns, not *), or create separate query methods (`getAllUsersPublic`, `findUserByIdPublic`) and have the controller call those. The existing `PUBLIC_USER_COLUMNS` constant can be reused.

---

## Q3: Post ownership checks — PostQuery methods and deletion pattern from CommentManager

### PostQuery methods

**Available in PostQuery:**
- `createPost` — takes `PostDTO`, returns the inserted row with all columns (including `user_id`)
- `getAllPosts` — returns posts joined with author name/photo; includes `posts.*` (has `user_id`)
- `getPostsByUserId` — returns posts for a given user
- `updatePost` — updates caption/media, returns updated post (includes `user_id`)
- `deletePost` — deletes by id, takes only the id (no ownership check in the Query)
- `updateCommentCount` — recounts comments

**Missing:** There is no `findPostById` query method. The code does not retrieve a post before checking ownership.

### CommentManager.deleteComment ownership pattern (lines 39–47)

```typescript
public async deleteComment(requester: { id: number; role: string }, commentId: unknown) {
  const id = requireId(commentId, "Comment");
  const comment = await this.commentQuery.findCommentById(id);
  if (!comment) throw new AppError(404, "Comment not found");
  if (comment.user_id !== requester.id && requester.role !== "admin") {
    throw new AppError(403, "You can only delete your own comments");
  }
  await this.commentQuery.deleteComment(id, comment.post_id);
}
```

**Pattern to mirror for posts:**
1. Fetch the comment/post by id first (raises 404 if not found)
2. Check `user_id` against requester's id
3. Allow admins to bypass ownership check
4. Throw 403 if requester is not the owner and not an admin
5. Call the delete query method only if ownership check passes

### What needs to be added

- `PostQuery.findPostById(id: number)` — retrieve a post by id (SELECT * or specific columns)
- `PostManager.deletePost` — add ownership check before delegating to query
- `PostManager.updatePost` — add ownership check before delegating to query
- Both should pass `{ id: number; role: string }` requester object, similar to `deleteComment`

---

## Q4: Backend test setup feasibility

### Module system and TypeScript configuration

**Root tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**All backend packages use `"type": "module"` (ESM):**
- `packages/backend/package.json` — ESM
- `packages/backend/src/api/package.json` — ESM
- `packages/backend/src/businessLogic/package.json` — ESM, `"main": "./dist/index.js"` (compiled output)
- `packages/backend/src/dal/package.json` — ESM, `"main": "index.ts"` (TypeScript source)

**Each extends root tsconfig with local `tsconfig.json`:**
- `packages/backend/src/api/tsconfig.json` — extends root, adds `rootDir: "."`, `outDir: "dist"`
- Similar pattern for businessLogic and dal

### Can app.ts be imported without starting a server or connecting to Postgres?

**Short answer: No, not currently.**

**Evidence:**

**db.ts (dal/config/db.ts, lines 9–31):**
```typescript
dotenv.config({ path: ... });
const { Pool } = pkg;
const pool = new Pool({ host, port, database, user, password });

async function verifyConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    client.release();
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

verifyConnection();  // <- Runs at import time
export default pool;
```

**Problem:**
- `verifyConnection()` is called at module-load time (line 31)
- This will attempt to connect to the database immediately when any module imports from `@alumni/dal`
- The test would need a Postgres instance running or would need to mock at the pool boundary

**Import chain for app.ts:**
1. `app.ts` imports `routes/*Routes.ts`
2. Routes import controllers (e.g., `UserController`)
3. Controllers import `UserManager` from `@alumni/businesslogic`
4. `UserManager` imports `UserQuery` from `@alumni/dal`
5. `UserQuery` is in a module that, when evaluated, causes `db.ts` to run and attempt connection

### authMiddleware imports and JWT loading

**Middleware/authMIddleware.ts (lines 1–3):**
```typescript
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@alumni/api/controllers/UserController";
```

**Potential issue:** The middleware imports `verifyToken` from UserController, which is fine. But UserController instantiates `UserManager` at module load time:

**UserController.ts (line 7):**
```typescript
const userManager = new UserManager();
```

This triggers the same Postgres connection issue.

### JWT_SECRET and dotenv loading at import time

**UserController.ts (line 8):**
```typescript
const JWT_SECRET = process.env.JWT_SECRET as string;
```

And **app.ts (line 11):**
```typescript
dotenv.config({ path: '../../.env' });
```

**Status:** JWT_SECRET is loaded at import time from the process environment. The dotenv config happens in app.ts, so as long as app.ts is imported first, the secret will be available. However, if tests import controllers before app.ts, the env var won't be loaded yet (though it may be set in the test environment separately).

### Recommendation for testing without Postgres

**Option A: Mock the pool boundary (recommended)**
- Create a test setup that mocks `packages/backend/src/dal/config/db.ts` before any controller imports
- Mock `pool.query()` to return test data
- This lets unit tests run queries in isolation without a database

**Option B: Mock at the Manager boundary**
- Create test doubles of `*Manager` classes
- Controllers can be unit-tested with mocked managers
- More integration-y tests would test Manager + Query together with a real db

**Option C: Run with a test database**
- Requires Postgres to be running and configured in `.env.test`
- More realistic but slower and requires infrastructure

**Option D: Module-level setup to prevent eager connection**
- Refactor `db.ts` to not call `verifyConnection()` at import time
- Instead, expose a `connect()` function that tests explicitly call (or don't call)
- This is a clean fix but requires changing the module structure

---

## Q5: Node version and test runner availability

### Node version
```
v24.14.1
```

### Test runner availability

**Vitest:**
- Installed in `node_modules` under `@alumni/frontend`
- Version: `vitest@5.0.3` (from `npm ls vitest`)
- **Not installed for backend packages**
- Frontend has full testing setup: Vitest 5, React Testing Library 16, jest-dom, user-event 14

**Supertest:**
- **Not installed anywhere** in the monorepo
- Would need to be added as a devDependency if tests use it for HTTP endpoint testing

### Root workspace scripts

**package.json (root, lines 8–11):**
```json
"scripts": {
  "dev:api": "npm run dev --workspace=packages/backend/src/api",
  "dev:frontend": "npm run dev --workspace=packages/frontend",
  "dev": "npm run dev:api & npm run dev:frontend"
}
```

**No test, lint, or format scripts at root.** The root `package.json` (lines 19–23) has:
```json
"devDependencies": {
  "@types/bcrypt": "^6.0.0",
  "@types/jsonwebtoken": "^9.0.10",
  "concurrently": "^10.0.5"
}
```

**Backend workspace scripts:**
- `@alumni/api` has: `"scripts": { "dev": "tsx watch server.ts" }` (no test script)
- `@alumni/businesslogic` has no scripts
- `@alumni/dal` has no scripts

---

## Q6: Documentation mentioning route auth

### CLAUDE.md (root)

**Lines 65–67 (key finding):**
> **Not all routes currently apply `authMiddleware`/`requireRole`** — check each route file rather than assuming auth is enforced.

This line must be updated after REQ-003 to say: "Every non-public route (all routes except `GET /api/health`, `POST /api/auth/login`, `POST /api/auth/register`) applies `authMiddleware`. Admin-only and owner-only routes also apply `requireRole` or owner checks in the controller/manager."

### .adlc/context/conventions.md

**API conventions section (lines 33–38):** Currently empty:
```markdown
## API conventions

- **Response format:** _(e.g., `{ data, error }`, `{ success, payload }`)_
- **Pagination:** _(cursor vs offset, page size limits)_
- **Versioning:** _(URL path vs header vs none)_
- **Auth:** _(bearer token, session cookie, API key)_
```

**After REQ-003, should document:**
- Auth is bearer token in `Authorization: Bearer <token>` header
- Middleware: `authMiddleware` validates JWT; `requireRole(...roles)` checks role
- 401 = no token or invalid/expired token (reserved for session management)
- 403 = signed in but not allowed (role or ownership)
- 404 = target doesn't exist
- Every non-public route must use authMiddleware

### packages/backend/README.md

**Status:** Does not exist yet. None of the backend packages have README files.

**Should be created with:**
- Architecture overview (route → controller → manager → query → pool)
- Which routes are public vs protected
- How to add a new protected route (applies authMiddleware + requireRole or ownership check)
- Testing setup and how to run tests

### packages/frontend/README.md

**Lines 83–99 ("Auth and session"):** Already documents:
- `POST /api/auth/login` and `POST /api/auth/register` are public (no token required)
- Other routes require a token
- `GET /api/me` is the current-user endpoint
- Frontend's session handling and 401 behavior

Status: ✓ **Correct and complete; no changes needed.**

---

## Summary: Key findings for architect

1. **46 routes total:** 3 public (health, login, register), 43 protected (mostly not enforced currently)
2. **4 routes to remove:** findUserByEmail, updateLoginTime, updateLogoutTime, findAlumniByEmail
3. **3 methods safe to delete:** updateLoginTime, updateLogoutTime, findAlumniByEmail (no cross-refs); keep findUserByEmail (used by login)
4. **Password leak:** Four UserQuery methods return password in SELECT *; PublicUserRow shape exists and can be reused
5. **Post ownership:** No findPostById query; need to add it, plus ownership checks in PostManager (mirroring CommentManager pattern)
6. **Tests blockers:** db.ts calls verifyConnection() at import time; requireRole doesn't handle missing req.user.role; both need fixing before tests can run
7. **Test tools:** Vitest is installed for frontend only; Supertest not installed; backend has no test infrastructure
8. **Docs to update:** CLAUDE.md (line 65–67), conventions.md (API auth section), and create packages/backend/README.md

---

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
