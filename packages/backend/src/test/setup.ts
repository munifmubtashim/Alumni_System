import { vi } from 'vitest';

// Replace the shared pg Pool for every test file. The query classes import it as
// '../config/db.js' (or '../config/db'); vi.mock matches on the resolved file, so
// all of them get this fake and no test opens a connection or logs a DB error.
vi.mock('../dal/config/db.ts', () => ({
  default: { query: vi.fn(), connect: vi.fn() },
}));
