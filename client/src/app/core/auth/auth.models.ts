export type AuthRole = 'user' | 'admin';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role?: AuthRole;
  avatar?: string | null;
  phone?: string;
  isAdmin?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
}

export interface AuthStatusResponse {
  message: string;
  user: AuthUser;
}