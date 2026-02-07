import bcrypt from 'bcryptjs';

import { db } from '@/backend/server/db/client';
import type { SessionUser, UserCredentialRow } from './auth.types';

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

const SQL_GET_CREDENTIALS = `
  SELECT id, name, email, password_hash, role, is_active
  FROM users
  WHERE email = $1
  LIMIT 1
`;

const SQL_GET_USER_BY_ID = `
  SELECT id, name, email, role, avatar_url, is_active, created_at, updated_at
  FROM users
  WHERE id = $1
  LIMIT 1
`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate an email / password combination against the database.
 *
 * Returns the session-safe user object on success, or `null` when the
 * credentials are invalid (wrong email, wrong password, or deactivated user).
 */
export async function validateCredentials(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const row = await db.queryOne<UserCredentialRow>(SQL_GET_CREDENTIALS, [
    email.toLowerCase().trim(),
  ]);

  if (!row) return null;
  if (!row.is_active) return null;

  const passwordMatches = await bcrypt.compare(password, row.password_hash);
  if (!passwordMatches) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

/**
 * Retrieve a user by primary key.
 *
 * Excludes the password hash -- this is intended for session refresh and
 * profile lookups only.
 */
export async function getUserById(id: string): Promise<SessionUser | null> {
  const row = await db.queryOne<
    SessionUser & { is_active: boolean }
  >(SQL_GET_USER_BY_ID, [id]);

  if (!row) return null;
  if (!row.is_active) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}
