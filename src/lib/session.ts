import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getActiveServerSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.sessionError === 'SESSION_REPLACED') {
    return null;
  }

  return session;
}
