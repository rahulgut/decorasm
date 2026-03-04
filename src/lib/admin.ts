import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Verify the current user is an admin. Returns the session if valid,
 * or a NextResponse error to return early.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (session.user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session };
}
