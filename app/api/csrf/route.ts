import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';

// GET /api/csrf - Get CSRF token
export async function GET() {
  const token = generateCsrfToken();
  
  const response = NextResponse.json({
    success: true,
    token,
  });

  // Set CSRF token in cookie
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return response;
}
