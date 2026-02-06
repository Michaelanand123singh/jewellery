/**
 * POST /api/v1/settings/email/test - Test email configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { EmailService } from '@/src/shared/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('POST', '/api/v1/settings/email/test', ip);

    await requireAdminRole(request);

    const emailService = new EmailService();
    const result = await emailService.testConnection();

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

