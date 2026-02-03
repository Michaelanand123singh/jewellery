/**
 * Google OAuth Service
 * Handles Google OAuth authentication flow
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { generateToken } from '@/lib/auth';
import { ValidationError, NotFoundError } from '@/src/shared/utils/errors';

// Lazy load env to avoid validation errors
function getGoogleConfig() {
  try {
    const { env } = require('@/lib/env');
    return {
      clientId: env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI,
    };
  } catch {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    };
  }
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export class GoogleOAuthService {
  private getConfig() {
    const config = getGoogleConfig();
    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
      throw new Error('Google OAuth not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI');
    }
    return config;
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const config = this.getConfig();
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
    const config = this.getConfig();

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to exchange code' }));
      throw new Error(`Failed to exchange code for token: ${error.error || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get user info from Google using access token
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Verify ID token (alternative to access token)
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    const config = this.getConfig();

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

    if (!response.ok) {
      throw new Error(`Failed to verify ID token: ${response.statusText}`);
    }

    const tokenInfo = await response.json();

    // Verify audience
    if (tokenInfo.aud !== config.clientId) {
      throw new Error('Invalid token audience');
    }

    return {
      id: tokenInfo.sub,
      email: tokenInfo.email,
      verified_email: tokenInfo.email_verified === 'true',
      name: tokenInfo.name,
      picture: tokenInfo.picture,
      given_name: tokenInfo.given_name,
      family_name: tokenInfo.family_name,
    };
  }

  /**
   * Handle Google OAuth callback and authenticate user
   * Returns JWT token and user data
   */
  async handleCallback(code: string): Promise<{ token: string; user: any }> {
    // Exchange code for token
    const tokenResponse = await this.exchangeCodeForToken(code);

    // Get user info from Google
    let googleUser: GoogleUserInfo;
    if (tokenResponse.id_token) {
      // Use ID token if available (more secure)
      googleUser = await this.verifyIdToken(tokenResponse.id_token);
    } else if (tokenResponse.access_token) {
      // Fallback to access token
      googleUser = await this.getUserInfo(tokenResponse.access_token);
    } else {
      throw new Error('No token received from Google');
    }

    // Verify email is verified
    if (!googleUser.verified_email) {
      throw new ValidationError('Google email is not verified');
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    }) as any;

    if (user) {
      // PHASE 3: User exists - check if they can use Google login
      // Block Google login for ADMIN and SUPER_ADMIN roles
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        throw new ValidationError('Google login is not allowed for admin accounts. Please use email/password login.');
      }

      // PHASE 6: If user exists with local provider, link Google account
      if (user.provider === 'local') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'google', // Switch to Google provider
            providerId: googleUser.id,
            // Keep password in case they want to switch back
          } as any,
        }) as any;
      } else if (user.provider === 'google') {
        // Update providerId if it changed
        if (user.providerId !== googleUser.id) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              providerId: googleUser.id,
            } as any,
          }) as any;
        }
      }
    } else {
      // Create new user with Google provider
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          provider: 'google',
          providerId: googleUser.id,
          role: 'USER', // Always USER for Google OAuth
          password: null, // No password for Google users
        } as any,
      }) as any;
    }

    // Generate JWT token using existing system
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      provider: user.provider || 'google',
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        provider: user.provider,
      },
    };
  }

  /**
   * Find user by Google provider ID
   */
  async findByProviderId(providerId: string) {
    return prisma.user.findFirst({
      where: {
        provider: 'google',
        providerId,
      } as any,
    });
  }
}

