interface UpdateQueryResult {
  text: string;
  params: unknown[];
}

// Builds a parameterized UPDATE query from a partial DTO. Returns null if no fields need updating.
export function buildUpdateQuery<T extends Record<string, unknown>>(
  table: string,
  id: string,
  data: Partial<T>,
  columnMap: Record<string, string>,
  returning = '*',
): UpdateQueryResult | null {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  for (const [key, column] of Object.entries(columnMap)) {
    const value = data[key];
    if (value !== undefined) {
      setClauses.push(`${column} = $${paramIndex++}`);
      params.push(value);
    }
  }

  if (setClauses.length === 0) return null;

  setClauses.push('updated_at = NOW()');

  const text = `
    UPDATE ${table}
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING ${returning}
  `;
  params.push(id);

  return { text, params };
}
