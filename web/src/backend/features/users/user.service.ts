import { userRepository } from './user.repository';
import { ApiError } from '@/backend/server/lib/api-error';
import { paginationMeta } from '@/shared/validations/common';
import type { User } from '@/shared/types';
import type { CreateUserInput, UpdateUserInput } from '@/shared/validations/schemas';

async function assertEmailUnique(
  email: string,
  excludeId?: string,
): Promise<void> {
  const existing = await userRepository.findByEmail(email);

  if (existing && existing.id !== excludeId) {
    throw ApiError.conflict(`A user with email "${email}" already exists`);
  }
}

export const userService = {
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

  async getUserById(id: string): Promise<User> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw ApiError.notFound('User');
    }

    return user;
  },

  async createUser(data: CreateUserInput): Promise<User> {
    await assertEmailUnique(data.email);

    return userRepository.create(data);
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    const existing = await userRepository.findById(id);

    if (!existing) {
      throw ApiError.notFound('User');
    }

    if (data.email !== undefined && data.email !== existing.email) {
      await assertEmailUnique(data.email, id);
    }

    const updated = await userRepository.update(id, data);

    if (!updated) {
      throw ApiError.notFound('User');
    }

    return updated;
  },
};
