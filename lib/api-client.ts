/**
 * API Client - Centralized API calls with consistent error handling
 */

const API_BASE = '/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data.errors
    );
  }

  return data;
}

export const apiClient = {
  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Use no-store for product endpoints to ensure fresh data
      cache: endpoint.includes('/products') ? 'no-store' : 'default',
    });

    return handleResponse<T>(response);
  },

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    return handleResponse<T>(response);
  },

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    return handleResponse<T>(response);
  },

  async delete<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    return handleResponse<T>(response);
  },
};

