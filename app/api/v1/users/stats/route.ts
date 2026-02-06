/**
 * GET /api/v1/users/stats - Get user statistics (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/src/domains/users/services/user.service';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(request);

    const userService = new UserService();
    const stats = await userService.getUserStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

