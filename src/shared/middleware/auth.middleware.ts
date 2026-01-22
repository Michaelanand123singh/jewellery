/**
 * Authentication middleware utilities
 */

import { NextRequest } from 'next/server';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }
  return user;
}

export async function requireAdminRole(request: NextRequest) {
  const user = await requireAdmin(request);
  if (!user) {
    throw new ForbiddenError('Admin access required');
  }
  return user;
}

