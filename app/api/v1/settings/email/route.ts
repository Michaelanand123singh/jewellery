/**
 * GET /api/v1/settings/email - Get email settings
 * PUT /api/v1/settings/email - Update email settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { SettingsService } from '@/src/domains/settings/services/settings.service';
import { emailSettingsSchema } from '@/src/domains/settings/validators/settings.validator';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', '/api/v1/settings/email', ip);

    await requireAdminRole(request);

    const settingsService = new SettingsService();
    const settings = await settingsService.getEmailSettings();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('PUT', '/api/v1/settings/email', ip);

    await requireAdminRole(request);

    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: '/api/v1/settings/email', method: 'PUT', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = emailSettingsSchema.parse(body);

    const settingsService = new SettingsService();
    await settingsService.saveEmailSettings(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Email settings updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

