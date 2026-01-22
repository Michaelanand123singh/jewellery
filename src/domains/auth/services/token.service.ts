/**
 * Token service - JWT token management
 */

import * as jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
}

export class TokenService {
  private getSecret(): string {
    if (!env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be set in environment variables');
    }
    return env.JWT_SECRET;
  }

  generateToken(payload: JWTPayload): string {
    const secret = this.getSecret();
    return jwt.sign(payload, secret, { expiresIn: '24h' });
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const secret = this.getSecret();
      const decoded = jwt.verify(token, secret) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  getAuthCookie(token: string): string {
    return `auth-token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400; ${
      env.NODE_ENV === 'production' ? 'Secure;' : ''
    }`;
  }

  getClearAuthCookie(): string {
    return 'auth-token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0;';
  }
}

