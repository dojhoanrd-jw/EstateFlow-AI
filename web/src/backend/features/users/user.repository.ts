import bcrypt from 'bcryptjs';
import { db } from '@/backend/server/db/client';
import { buildUpdateQuery } from '@/backend/server/db/build-update-query';
import type { User } from '@/shared/types';
import type { CreateUserInput, UpdateUserInput } from '@/shared/validations/schemas';

const BCRYPT_SALT_ROUNDS = 12;

// Excludes password_hash from all SELECT/RETURNING clauses
const USER_SAFE_COLUMNS = [
  'id', 'name', 'email', 'role',
  'avatar_url', 'is_active', 'created_at', 'updated_at',
] as const;

const USER_SAFE_COLUMNS_STR = USER_SAFE_COLUMNS.join(', ');

const SELECT_USER_SAFE = `
  SELECT ${USER_SAFE_COLUMNS_STR}
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
  RETURNING ${USER_SAFE_COLUMNS_STR}
`;

const SQL_COUNT_ALL = `
  SELECT COUNT(*)::int AS total FROM users
`;

const UPDATABLE_COLUMNS: Record<keyof UpdateUserInput, string> = {
  name: 'name',
  email: 'email',
  role: 'role',
  is_active: 'is_active',
};

export const userRepository = {
  async findAll(page: number, limit: number): Promise<User[]> {
    const offset = (page - 1) * limit;
    return db.queryMany<User>(SQL_FIND_ALL, [limit, offset]);
  },

  async findById(id: string): Promise<User | null> {
    return db.queryOne<User>(SQL_FIND_BY_ID, [id]);
  },

  async findByEmail(email: string): Promise<User | null> {
    return db.queryOne<User>(SQL_FIND_BY_EMAIL, [email]);
  },

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

  async update(id: string, data: UpdateUserInput): Promise<User | null> {
    const query = buildUpdateQuery('users', id, data, UPDATABLE_COLUMNS, USER_SAFE_COLUMNS_STR);
    if (!query) return this.findById(id);
    return db.queryOne<User>(query.text, query.params);
  },

  async countAll(): Promise<number> {
    const row = await db.queryOne<{ total: number }>(SQL_COUNT_ALL);
    return row?.total ?? 0;
  },
};
