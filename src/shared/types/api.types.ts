/**
 * API-specific types
 */

import { ApiResponse } from './common.types';

export type ApiError = {
  success: false;
  error: string;
  errors?: Array<{ field: string; message: string }>;
  code?: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export type RequestContext = {
  userId?: string;
  role?: string;
  ip?: string;
};

