/**
 * POST /api/v1/auth/login
 * Login endpoint using new service layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthService } from '@/src/domains/auth/services/auth.service';
import { loginSchema } from '@/src/domains/auth/validators/login.validator';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('POST', '/api/v1/auth/login', ip);

    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const authService = new AuthService();
    const result = await authService.login(validatedData, ip);

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
      message: 'Login successful',
      data: result.user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

