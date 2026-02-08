import bcrypt from 'bcryptjs';
import { db } from '@/backend/server/db/client';
import { buildUpdateQuery } from '@/backend/server/db/build-update-query';
import type { User } from '@/shared/types';
import type { CreateUserInput, UpdateUserInput } from '@/shared/validations/schemas';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BCRYPT_SALT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// SQL Fragments
// ---------------------------------------------------------------------------

/**
 * Select all user columns EXCEPT password_hash.
 * This projection is reused across every read query to ensure
 * the password hash never leaves the repository layer.
 */
const SELECT_USER_SAFE = `
  SELECT
    id,
    name,
    email,
    role,
    avatar_url,
    is_active,
    created_at,
    updated_at
  FROM users
`;

const SQL_FIND_ALL = `
  ${SELECT_USER_SAFE}
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2
`;

const SQL_FIND_BY_ID = `
  ${SELECT_USER_SAFE}
  WHERE id = $1
  LIMIT 1
`;

const SQL_FIND_BY_EMAIL = `
  ${SELECT_USER_SAFE}
  WHERE email = $1
  LIMIT 1
`;

const SQL_INSERT = `
  INSERT INTO users (name, email, password_hash, role)
  VALUES ($1, $2, $3, $4)
  RETURNING
    id,
    name,
    email,
    role,
    avatar_url,
    is_active,
    created_at,
    updated_at
`;

const SQL_COUNT_ALL = `
  SELECT COUNT(*)::int AS total FROM users
`;

// ---------------------------------------------------------------------------
// Column mapping for dynamic updates
// ---------------------------------------------------------------------------

const UPDATABLE_COLUMNS: Record<keyof UpdateUserInput, string> = {
  name: 'name',
  email: 'email',
  role: 'role',
  is_active: 'is_active',
};

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export const userRepository = {
  /**
   * Retrieve a paginated list of users ordered by creation date.
   * The password_hash column is excluded from the projection.
   */
  async findAll(page: number, limit: number): Promise<User[]> {
    const offset = (page - 1) * limit;
    return db.queryMany<User>(SQL_FIND_ALL, [limit, offset]);
  },

  /**
   * Retrieve a single user by UUID (without password_hash).
   */
  async findById(id: string): Promise<User | null> {
    return db.queryOne<User>(SQL_FIND_BY_ID, [id]);
  },

  /**
   * Look up a user by email address (without password_hash).
   * Primarily used for uniqueness validation before create/update.
   */
  async findByEmail(email: string): Promise<User | null> {
    return db.queryOne<User>(SQL_FIND_BY_EMAIL, [email]);
  },

  /**
   * Create a new user. The plaintext password is hashed with bcrypt
   * before being stored. The returned row never includes password_hash.
   */
  async create(data: CreateUserInput): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    const result = await db.queryOne<User>(SQL_INSERT, [
      data.name,
      data.email,
      passwordHash,
      data.role,
    ]);
    if (!result) throw new Error('INSERT did not return a row');
    return result;
  },

  /**
   * Dynamically update only the provided fields on a user.
   * Builds a parameterized SET clause at runtime.
   * The RETURNING clause excludes password_hash.
   */
  async update(id: string, data: UpdateUserInput): Promise<User | null> {
    const returning = 'id, name, email, role, avatar_url, is_active, created_at, updated_at';
    const query = buildUpdateQuery('users', id, data, UPDATABLE_COLUMNS, returning);
    if (!query) return this.findById(id);
    return db.queryOne<User>(query.text, query.params);
  },

  /**
   * Return the total number of users for pagination metadata.
   */
  async countAll(): Promise<number> {
    const row = await db.queryOne<{ total: number }>(SQL_COUNT_ALL);
    return row?.total ?? 0;
  },
};
