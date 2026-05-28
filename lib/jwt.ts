import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'splitday-secret-key-change-in-production'
);

const EXPIRES_IN = '7d';

export async function signToken(payload: { userId: string; email: string; name: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string; name: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; email: string; name: string };
  } catch {
    return null;
  }
}
