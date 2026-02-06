/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 * Redirects user to Google OAuth consent screen
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleOAuthService } from '@/src/domains/auth/services/google-oauth.service';

export async function GET(request: NextRequest) {
  try {
    const googleOAuthService = new GoogleOAuthService();
    
    // Generate state for CSRF protection (optional but recommended)
    const state = crypto.randomUUID();
    
    // Get authorization URL
    const authUrl = googleOAuthService.getAuthorizationUrl(state);
    
    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate Google login' },
      { status: 500 }
    );
  }
}

