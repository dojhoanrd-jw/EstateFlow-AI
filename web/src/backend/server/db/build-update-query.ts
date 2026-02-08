// ---------------------------------------------------------------------------
// Shared dynamic UPDATE query builder
//
// Builds a parameterized SET clause from a partial object, using a column
// mapping to translate DTO keys to SQL column names. Automatically appends
// `updated_at = NOW()` and the WHERE clause for the primary key.
// ---------------------------------------------------------------------------

interface UpdateQueryResult {
  text: string;
  params: unknown[];
}

/**
 * Builds a dynamic UPDATE query from a partial DTO.
 *
 * @param table        - SQL table name
 * @param id           - Row primary key value
 * @param data         - Partial DTO with only the fields to update
 * @param columnMap    - Maps DTO keys → SQL column names
 * @param returning    - RETURNING clause columns (default: '*')
 * @returns `null` if no fields need updating, otherwise `{ text, params }`
 */
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
