/**
 * GET /api/v1/auth/me
 * Get current user endpoint using new service layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/src/domains/auth/services/auth.service';
import { requireAuth } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const authService = new AuthService();
    const currentUser = await authService.getCurrentUser(user.id);

    return NextResponse.json({
      success: true,
      data: currentUser,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

