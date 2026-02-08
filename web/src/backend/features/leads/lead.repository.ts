import { db } from '@/backend/server/db/client';
import { buildUpdateQuery } from '@/backend/server/db/build-update-query';
import type { Lead } from '@/shared/types';
import type { CreateLeadInput, UpdateLeadInput } from '@/shared/validations/schemas';

// ---------------------------------------------------------------------------
// SQL Fragments
// ---------------------------------------------------------------------------

const SELECT_LEAD = `
  SELECT
    id,
    name,
    email,
    phone,
    project_interest,
    source,
    budget,
    notes,
    assigned_agent_id,
    created_at,
    updated_at
  FROM leads
`;

const SQL_FIND_ALL = `
  ${SELECT_LEAD}
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2
`;

const SQL_FIND_BY_ID = `
  ${SELECT_LEAD}
  WHERE id = $1
  LIMIT 1
`;

const SQL_INSERT = `
  INSERT INTO leads (name, email, phone, project_interest, source, budget, notes, assigned_agent_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *
`;

const SQL_COUNT_ALL = `
  SELECT COUNT(*)::int AS total FROM leads
`;

// ---------------------------------------------------------------------------
// Column mapping for dynamic updates
// ---------------------------------------------------------------------------

const UPDATABLE_COLUMNS: Record<keyof UpdateLeadInput, string> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  project_interest: 'project_interest',
  source: 'source',
  budget: 'budget',
  notes: 'notes',
  assigned_agent_id: 'assigned_agent_id',
};

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export const leadRepository = {
  /**
   * Retrieve a paginated list of leads ordered by most recently created.
   */
  async findAll(page: number, limit: number): Promise<Lead[]> {
    const offset = (page - 1) * limit;
    return db.queryMany<Lead>(SQL_FIND_ALL, [limit, offset]);
  },

  /**
   * Retrieve a single lead by its UUID.
   */
  async findById(id: string): Promise<Lead | null> {
    return db.queryOne<Lead>(SQL_FIND_BY_ID, [id]);
  },

  /**
   * Insert a new lead and return the complete row.
   */
  async create(data: CreateLeadInput): Promise<Lead> {
    const result = await db.queryOne<Lead>(SQL_INSERT, [
      data.name,
      data.email ?? null,
      data.phone ?? null,
      data.project_interest ?? null,
      data.source ?? null,
      data.budget ?? null,
      data.notes ?? null,
      data.assigned_agent_id ?? null,
    ]);
    if (!result) throw new Error('INSERT did not return a row');
    return result;
  },

  /**
   * Dynamically update only the provided fields on a lead.
   * Builds a parameterized SET clause at runtime to avoid overwriting
   * fields that were not included in the request body.
   */
  async update(id: string, data: UpdateLeadInput): Promise<Lead | null> {
    const query = buildUpdateQuery('leads', id, data, UPDATABLE_COLUMNS);
    if (!query) return this.findById(id);
    return db.queryOne<Lead>(query.text, query.params);
  },

  /**
   * Return the total number of leads for pagination metadata.
   */
  async countAll(): Promise<number> {
    const row = await db.queryOne<{ total: number }>(SQL_COUNT_ALL);
    return row?.total ?? 0;
  },
};
