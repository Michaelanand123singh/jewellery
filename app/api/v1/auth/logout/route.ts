/**
 * POST /api/v1/auth/logout
 * Logout endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TokenService } from '@/src/domains/auth/services/token.service';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const tokenService = new TokenService();
  
  cookieStore.set('auth-token', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    maxAge: 0,
  });

  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
}

