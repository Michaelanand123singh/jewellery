/**
 * Error handling middleware
 */

import { NextResponse } from 'next/server';
import { createApiError, AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function handleApiError(error: unknown): NextResponse {
  const apiError = createApiError(error);
  
  // Log error for debugging
  if (error instanceof AppError) {
    logger.error(`API Error: ${error.message}`, {
      statusCode: error.statusCode,
      code: error.code,
    });
  } else {
    logger.error('Unexpected API error', { error });
  }

  return NextResponse.json(apiError, {
    status: error instanceof AppError ? error.statusCode : 500,
  });
}

