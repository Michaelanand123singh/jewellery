/**
 * GET /api/v1/users/[id] - Get user by ID (admin only)
 * PUT /api/v1/users/[id] - Update user (admin only)
 * DELETE /api/v1/users/[id] - Delete user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/src/domains/users/services/user.service';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminRole(request);
    const { id } = await params;

    const userService = new UserService();
    const user = await userService.getUserById(id);

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminRole(request);
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const userService = new UserService();
    const user = await userService.updateUser(id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminRole(request);
    const { id } = await params;

    const userService = new UserService();
    await userService.deleteUser(id);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

