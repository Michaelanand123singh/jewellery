/**
 * Auth domain types
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface AuthToken {
  token: string;
  expiresIn: number;
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

