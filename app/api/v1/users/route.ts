/**
 * GET /api/v1/users - Get all users (admin only)
 * POST /api/v1/users - Create user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/src/domains/users/services/user.service';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(request);
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filters
    const filters: any = {};
    if (searchParams.get('role')) {
      filters.role = searchParams.get('role');
    }
    if (searchParams.get('provider')) {
      filters.provider = searchParams.get('provider');
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search');
    }
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!);
    }
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!);
    }
    if (searchParams.get('hasOrders') === 'true') {
      filters.hasOrders = true;
    } else if (searchParams.get('hasOrders') === 'false') {
      filters.hasOrders = false;
    }

    // Build sort
    const sort: any = {};
    if (searchParams.get('sortBy')) {
      sort.sortBy = searchParams.get('sortBy');
    }
    if (searchParams.get('sortOrder')) {
      sort.sortOrder = searchParams.get('sortOrder');
    }

    const userService = new UserService();
    const result = await userService.getAllUsers(filters, sort, { page, limit, skip });

    return NextResponse.json({
      success: true,
      data: result.users,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminRole(request);
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // This would typically use AuthService to create user with hashed password
    // For now, we'll return an error as user creation should go through auth flow
    return NextResponse.json(
      {
        success: false,
        error: 'User creation should be done through registration endpoint',
      },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

