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
    // Create error with status code for proper handling
    const error = new ApiError(
      data.error || 'An error occurred',
      response.status,
      data.errors
    );
    // Attach status to error object for easy checking
    (error as any).status = response.status;
    throw error;
  }

  return data;
}

// Get CSRF token from cookie or fetch it
async function getCsrfToken(): Promise<string | null> {
  // Try to get from cookie first
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='));
  if (csrfCookie) {
    return csrfCookie.split('=')[1];
  }

  // If not in cookie, fetch it
  try {
    const response = await fetch('/api/csrf');
    const data = await response.json();
    if (data.success && data.token) {
      return data.token;
    }
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error);
  }

  return null;
}

// Build headers with CSRF token for state-changing methods
async function buildHeaders(includeCsrf: boolean = false): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeCsrf) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return headers;
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
    const headers = await buildHeaders(true);
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    return handleResponse<T>(response);
  },

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const headers = await buildHeaders(true);
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers,
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

    const headers = await buildHeaders(true);
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers,
      cache: 'no-store',
    });

    return handleResponse<T>(response);
  },
};

