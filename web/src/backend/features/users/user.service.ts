import { userRepository } from './user.repository';
import { ServiceError } from '@/backend/server/lib/service-error';
import { paginationMeta } from '@/shared/validations/common';
import type { User } from '@/shared/types';
import type { CreateUserInput, UpdateUserInput } from '@/shared/validations/schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Assert that the given email is not already taken by another user.
 * When `excludeId` is provided the check ignores that user's own row,
 * which is necessary for update operations where the email stays the same.
 */
async function assertEmailUnique(
  email: string,
  excludeId?: string,
): Promise<void> {
  const existing = await userRepository.findByEmail(email);

  if (existing && existing.id !== excludeId) {
    throw ServiceError.conflict(`A user with email "${email}" already exists`);
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const userService = {
  /**
   * Get a paginated list of all users with pagination metadata.
   */
  async getUsers(
    page: number,
    limit: number,
  ): Promise<{
    users: User[];
    meta: ReturnType<typeof paginationMeta>;
  }> {
    const [users, total] = await Promise.all([
      userRepository.findAll(page, limit),
      userRepository.countAll(),
    ]);

    return {
      users,
      meta: paginationMeta(total, page, limit),
    };
  },

  /**
   * Get a single user by ID or throw a 404 ServiceError.
   */
  async getUserById(id: string): Promise<User> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw ServiceError.notFound('User');
    }

    return user;
  },

  /**
   * Create a new user after verifying email uniqueness.
   * Password hashing is delegated to the repository layer.
   */
  async createUser(data: CreateUserInput): Promise<User> {
    await assertEmailUnique(data.email);

    return userRepository.create(data);
  },

  /**
   * Update an existing user. When the email field is being changed,
   * uniqueness is re-validated excluding the current user's own row.
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    const existing = await userRepository.findById(id);

    if (!existing) {
      throw ServiceError.notFound('User');
    }

    if (data.email !== undefined && data.email !== existing.email) {
      await assertEmailUnique(data.email, id);
    }

    const updated = await userRepository.update(id, data);

    if (!updated) {
      throw ServiceError.notFound('User');
    }

    return updated;
  },
};
