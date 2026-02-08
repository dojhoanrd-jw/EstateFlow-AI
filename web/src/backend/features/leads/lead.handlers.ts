import { withAuth, type AuthenticatedRequest } from '@/backend/server/lib/with-auth';
import { withPermission } from '@/backend/server/lib/with-permission';
import { apiSuccess, apiCreated, apiError } from '@/backend/server/lib/api-response';
import { leadService } from './lead.service';
import { createLeadSchema } from '@/shared/validations/schemas';
import { paginationSchema } from '@/shared/validations/common';

// ---------------------------------------------------------------------------
// GET /api/leads
// ---------------------------------------------------------------------------

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const { leads, meta } = await leadService.getLeads(page, limit);

    return apiSuccess(leads, 200, meta);
  } catch (error) {
    return apiError(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/leads  (admin only)
// ---------------------------------------------------------------------------

export const POST = withPermission(
  ['admin'],
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const data = createLeadSchema.parse(body);

      const lead = await leadService.createLead(data);

      return apiCreated(lead);
    } catch (error) {
      return apiError(error);
    }
  },
);
