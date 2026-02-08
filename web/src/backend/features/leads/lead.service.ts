import { leadRepository } from './lead.repository';
import { ServiceError } from '@/backend/server/lib/service-error';
import { paginationMeta } from '@/shared/validations/common';
import type { Lead } from '@/shared/types';
import type { CreateLeadInput, UpdateLeadInput } from '@/shared/validations/schemas';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const leadService = {
  /**
   * Get a paginated list of all leads with pagination metadata.
   */
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

  /**
   * Get a single lead by ID or throw a 404 ServiceError.
   */
  async getLeadById(id: string): Promise<Lead> {
    const lead = await leadRepository.findById(id);

    if (!lead) {
      throw ServiceError.notFound('Lead');
    }

    return lead;
  },

  /**
   * Create a new lead and return the persisted row.
   */
  async createLead(data: CreateLeadInput): Promise<Lead> {
    return leadRepository.create(data);
  },

  /**
   * Update an existing lead. Verifies the lead exists before applying changes.
   * Only the fields present in `data` will be modified.
   */
  async updateLead(id: string, data: UpdateLeadInput): Promise<Lead> {
    const existing = await leadRepository.findById(id);

    if (!existing) {
      throw ServiceError.notFound('Lead');
    }

    const updated = await leadRepository.update(id, data);

    if (!updated) {
      throw ServiceError.notFound('Lead');
    }

    return updated;
  },
};
