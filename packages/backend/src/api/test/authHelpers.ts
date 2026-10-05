import jwt from 'jsonwebtoken';

export interface TokenClaims {
  sub: number;
  role: string;
}

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not set; check vitest.config.ts test.env');
  return value;
}

/** A valid token signed with the test secret, shaped like UserController's signToken. */
export function tokenFor(claims: TokenClaims): string {
  return jwt.sign(claims, secret(), { expiresIn: '1h' });
}

/** Correct secret, but expired a minute ago. */
export function expiredToken(claims: TokenClaims = { sub: 1, role: 'student' }): string {
  return jwt.sign({ ...claims, exp: Math.floor(Date.now() / 1000) - 60 }, secret());
}

/** Unexpired, but signed with a different secret. */
export function badSignatureToken(claims: TokenClaims = { sub: 1, role: 'student' }): string {
  return jwt.sign(claims, `${secret()}-wrong`, { expiresIn: '1h' });
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}
