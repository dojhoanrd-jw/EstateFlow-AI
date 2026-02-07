import type { UserRole } from '@/shared/types';

/**
 * Minimal user object stored in the JWT / session.
 * Keep this lean -- only include what the frontend needs on every request.
 */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Row shape returned by the users table when we need the password hash
 * for credential verification (never exposed outside the auth service).
 */
export interface UserCredentialRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
}
