/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 * Exchanges code for token, creates/updates user, issues JWT
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GoogleOAuthService } from '@/src/domains/auth/services/google-oauth.service';
import { handleApiError } from '@/src/shared/middleware/error.middleware';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=missing_code', request.url)
      );
    }

    // Handle OAuth callback
    const googleOAuthService = new GoogleOAuthService();
    const result = await googleOAuthService.handleCallback(code);

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', result.token, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      secure: process.env.NODE_ENV === 'production',
    });

    // Redirect to home page or return JSON based on Accept header
    const acceptHeader = request.headers.get('accept');
    if (acceptHeader?.includes('application/json')) {
      return NextResponse.json({
        success: true,
        message: 'Google login successful',
        data: {
          ...result.user,
          token: result.token,
        },
      });
    }

    // Redirect to home page on success
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not allowed for admin')) {
        return NextResponse.redirect(
          new URL('/login?error=admin_google_login_disabled', request.url)
        );
      }
      if (error.message.includes('not verified')) {
        return NextResponse.redirect(
          new URL('/login?error=email_not_verified', request.url)
        );
      }
    }

    return handleApiError(error);
  }
}

