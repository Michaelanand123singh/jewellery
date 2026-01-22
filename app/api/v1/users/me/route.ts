/**
 * GET /api/v1/users/me - Get current user profile
 * PUT /api/v1/users/me - Update user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/src/domains/auth/repositories/user.repository';
import { requireAuth } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const userRepository = new UserRepository();
    const fullUser = await userRepository.findById(user.id);

    return NextResponse.json({
      success: true,
      data: fullUser,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const updateData = updateUserSchema.parse(body);

    const userRepository = new UserRepository();
    const updatedUser = await userRepository.update(user.id, updateData);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

