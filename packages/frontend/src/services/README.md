# services/

**Purpose:** non-UI code that talks to the outside world:

- `httpClient.ts`: the single axios instance (base URL `/api`). It adds the `Authorization` header and calls the one handler registered with `setUnauthorizedHandler(fn | null)` when an authed request gets a 401. It passes that request's own token and skips `/auth/login` and `/auth/register`. `features/auth/SessionBridge` registers the handler, so this folder never imports app code (ADR-03).
- `authToken.ts`: the only home of the token (`localStorage['token']`). `subscribe` fires on changes in this tab and others, `getLiveToken` is a pure read that returns `null` for a missing or expired token, and `getTokenExpiresAt` / `isTokenExpired` read the token's `exp`. `setToken` returns `false` if storage refuses the write.
- `authApi.ts`: endpoint functions `login`, `register`, `getMe`, `updateMyProfile` and `changePassword`.
- `alumniApi.ts`: `searchAlumni(params)` for `GET /api/alumni` (returns `{ items, total }`). Blank text and missing filters are left out of the query string; `sort` (`name` | `graduationYear`) and `order` (`asc` | `desc`) go only when set (REQ-015; without them the API sorts by name, the directory's order); `page` and `pageSize` are always sent, and the page size is the caller's choice. `getAlumniProfile(id)` for `GET /api/alumni/:id` (the id is URL-encoded, so a `/` or `?` in it can never change which endpoint is called) and `getPostsByUser(userId)` for `GET /api/posts/user/:userId` (newest first, as the API returns them).
- `postsApi.ts`: posts and comments. `listPosts({ limit, offset })` for `GET /api/posts` (newest first, author fields joined), `createPost({ caption })` (answers with the bare row, no author fields), `updatePost(id, { caption })`, `deletePost(id)`, `listComments(postId)`, `createComment(postId, { content, parent_id? })` (`parent_id` makes it a reply), `updateComment(id, { content })` (`PUT /api/comments/:id`) and `deleteComment(id)`. Ids are URL-encoded like `getAlumniProfile`; the delete calls resolve to nothing (the API's message is ignored). No caching here: the feed's hooks own that.
- `adminApi.ts` (REQ-015): the admin-only `/api/admin/*` endpoints. `getAdminStats()` (`GET /admin/stats`: alumni, students, posts, mentors), `createAlumniAccount(input)` (`POST /admin/alumni`, answers 201 with the new alumni row; 409 if the email is taken), `updateAlumniAccount(id, input)` (`PUT /admin/alumni/:id`, the six editable fields) and `deleteAlumniAccount(id)` (`DELETE /admin/alumni/:id`; removes the account, its posts and comments; 403 for the admin's own account). The id is the alumni id, URL-encoded. A non-admin gets a 403, which callers show as an error, never a logout (ADR-03).
- `httpErrors.ts`: `isNotFoundError(err)`, true only for an axios error whose response is a 404 (a network error or any other status is false), so a page can show "not found" without hiding real failures; `serverMessage(data)`, the API's `{ message }` text from a response body, or undefined when it is missing or blank (every feature's error mapper uses it).

**May import:** `axios`, browser APIs, and types from `@alumni/shared`.

**Must not import:** React or any UI code (`@/components/**`, `@/features/**`, `@/app/**`).

**Imported by:** `features/` and `app/`.
