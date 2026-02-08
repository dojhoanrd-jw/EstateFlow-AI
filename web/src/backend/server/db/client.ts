import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', (client) => {
  client.query("SET statement_timeout = '10000'");
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

export interface TxClient {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>;
  queryOne<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T | null>;
  queryMany<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

function createTxClient(client: PoolClient): TxClient {
  return {
    async query<T extends QueryResultRow = QueryResultRow>(
      text: string,
      params?: unknown[],
    ): Promise<QueryResult<T>> {
      const start = Date.now();
      const result = await client.query<T>(text, params);
      const duration = Date.now() - start;
      if (duration > 200) {
        console.warn(`[DB/TX] Slow query (${duration}ms):`, text.slice(0, 80));
      }
      return result;
    },
    async queryOne<T extends QueryResultRow = QueryResultRow>(
      text: string,
      params?: unknown[],
    ): Promise<T | null> {
      const result = await this.query<T>(text, params);
      return result.rows[0] ?? null;
    },
    async queryMany<T extends QueryResultRow = QueryResultRow>(
      text: string,
      params?: unknown[],
    ): Promise<T[]> {
      const result = await this.query<T>(text, params);
      return result.rows;
    },
  };
}

export const db = {
  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (duration > 200) {
      console.warn(`[DB] Slow query (${duration}ms):`, text.slice(0, 80));
    }

    return result;
  },

  async queryOne<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows[0] ?? null;
  },

  async queryMany<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T[]> {
    const result = await this.query<T>(text, params);
    return result.rows;
  },

  async transaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(createTxClient(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  pool,
};
