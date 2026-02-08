import type { UserRole } from '@/shared/types';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserCredentialRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
}
