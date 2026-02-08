import { leadRepository } from './lead.repository';
import { ApiError } from '@/backend/server/lib/api-error';
import { paginationMeta } from '@/shared/validations/common';
import type { Lead } from '@/shared/types';
import type { CreateLeadInput, UpdateLeadInput } from '@/shared/validations/schemas';

export const leadService = {
  async getLeads(
    page: number,
    limit: number,
  ): Promise<{
    leads: Lead[];
    meta: ReturnType<typeof paginationMeta>;
  }> {
    const [leads, total] = await Promise.all([
      leadRepository.findAll(page, limit),
      leadRepository.countAll(),
    ]);

    return {
      leads,
      meta: paginationMeta(total, page, limit),
    };
  },

  async getLeadById(id: string): Promise<Lead> {
    const lead = await leadRepository.findById(id);

    if (!lead) {
      throw ApiError.notFound('Lead');
    }

    return lead;
  },

  async createLead(data: CreateLeadInput): Promise<Lead> {
    return leadRepository.create(data);
  },

  async updateLead(id: string, data: UpdateLeadInput): Promise<Lead> {
    const existing = await leadRepository.findById(id);

    if (!existing) {
      throw ApiError.notFound('Lead');
    }

    const updated = await leadRepository.update(id, data);

    if (!updated) {
      throw ApiError.notFound('Lead');
    }

    return updated;
  },
};
