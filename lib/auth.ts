import { cookies } from 'next/headers';
import { verifyToken } from './jwt';

export const COOKIE_NAME = 'splitday_token';

/** Returns the verified user payload from the request cookie, or null. */
export async function getAuthUser(): Promise<{ userId: string; email: string; name: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
