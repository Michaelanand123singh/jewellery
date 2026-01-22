/**
 * POST /api/v1/auth/register
 * Register endpoint using new service layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthService } from '@/src/domains/auth/services/auth.service';
import { registerSchema } from '@/src/domains/auth/validators/register.validator';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('POST', '/api/v1/auth/register', ip);

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const authService = new AuthService();
    const result = await authService.register(validatedData, ip);

    // Set cookie
    const cookieStore = await cookies();
    const tokenService = authService.getTokenService();
    cookieStore.set('auth-token', result.token, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: result.user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

