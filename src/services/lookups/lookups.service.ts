// ======================================================
// src/services/lookups/lookups.service.ts
// Reads lookup_values table (schema-aware), returns camelCase
// ======================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface LookupValueDto {
  id: string;
  schoolId: string | null;
  category: string;
  code: string;
  lookupKey: string;
  lookupValue: string;
  description: string | null;
  displayOrder: number;
  parentId: string | null;
  isSystemDefault: boolean;
  isActive: boolean;
  isDeleted: boolean;
  metadata: unknown;
  createdById: string;
  updatedById: string;
  deletedById: string | null;
  createdAt: unknown;
  updatedAt: unknown;
  deletedAt: unknown;
}

interface LookupRow {
  id?: string | number | null;
  school_id?: string | number | null;
  category?: string | null;
  code?: string | null;
  lookup_key?: string | null;
  lookup_value?: string | null;
  description?: string | null;
  display_order?: number | null;
  parent_id?: string | number | null;
  is_system_default?: boolean | null;
  is_active?: boolean | null;
  is_deleted?: boolean | null;
  metadata?: unknown;
  created_by_id?: string | number | null;
  updated_by_id?: string | number | null;
  deleted_by_id?: string | number | null;
  created_at?: unknown;
  updated_at?: unknown;
  deleted_at?: unknown;
}

@Injectable()
export class LookupsService {
  private schema: string | null = null;

  constructor(private readonly dataSource: DataSource) {}

  private async getSchema(): Promise<string> {
    if (this.schema) return this.schema;
    try {
      const rows = await this.dataSource.query<{ schema_name: string }[]>(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'e_schooling'`,
      );
      this.schema = rows.length > 0 ? 'e_schooling' : 'public';
    } catch {
      this.schema = 'public';
    }
    return this.schema;
  }

  private async table(): Promise<string> {
    const schema = await this.getSchema();
    return `"${schema}"."lookup_values"`;
  }

  /** Convert a snake_case DB row to the camelCase shape the frontend expects */
  private mapRow(row: LookupRow): LookupValueDto | null {
    if (!row) return null;
    return {
      id: row.id !== undefined && row.id !== null ? String(row.id) : '',
      schoolId:
        row.school_id !== undefined && row.school_id !== null
          ? String(row.school_id)
          : null,
      category: row.category ? String(row.category) : '',
      code: row.code ? String(row.code) : '',
      lookupKey: row.lookup_key ? String(row.lookup_key) : '',
      lookupValue: row.lookup_value ? String(row.lookup_value) : '',
      description: row.description ? String(row.description) : null,
      displayOrder: Number(row.display_order ?? 0),
      parentId:
        row.parent_id !== undefined && row.parent_id !== null
          ? String(row.parent_id)
          : null,
      isSystemDefault: Boolean(row.is_system_default),
      isActive: Boolean(row.is_active),
      isDeleted: Boolean(row.is_deleted),
      metadata: row.metadata ?? null,
      createdById:
        row.created_by_id !== undefined && row.created_by_id !== null
          ? String(row.created_by_id)
          : '',
      updatedById:
        row.updated_by_id !== undefined && row.updated_by_id !== null
          ? String(row.updated_by_id)
          : '',
      deletedById:
        row.deleted_by_id !== undefined && row.deleted_by_id !== null
          ? String(row.deleted_by_id)
          : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? null,
    };
  }

  /* ─────────────────────────────────────────────────────
   * Find all (optional filters) — admin management table
   * ───────────────────────────────────────────────────── */
  async findAll(filters: {
    schoolId?: string;
    category?: string;
    isActive?: string;
    search?: string;
    page?: string;
    limit?: string;
  }): Promise<{
    data: (LookupValueDto | null)[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const t = await this.table();
    const conditions: string[] = ['is_deleted = false'];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.isActive !== undefined) {
      const active = filters.isActive === 'true' || filters.isActive === '1';
      conditions.push(`is_active = $${idx++}`);
      params.push(active);
    }

    if (filters.category) {
      conditions.push(`UPPER(category) = UPPER($${idx++})`);
      params.push(filters.category);
    }

    if (filters.search) {
      conditions.push(
        `(LOWER(lookup_value) LIKE LOWER($${idx}) OR LOWER(lookup_key) LIKE LOWER($${idx}) OR LOWER(code) LIKE LOWER($${idx}))`,
      );
      params.push(`%${filters.search}%`);
      idx++;
    }

    if (filters.schoolId) {
      conditions.push(`(school_id IS NULL OR school_id = $${idx++})`);
      params.push(Number(filters.schoolId));
    } else {
      conditions.push(`school_id IS NULL`);
    }

    const where = conditions.join(' AND ');

    // Count total
    const countRes = await this.dataSource.query<{ total: string | number }[]>(
      `SELECT COUNT(*) AS total FROM ${t} WHERE ${where}`,
      params,
    );
    const total = Number(countRes[0]?.total ?? 0);

    const page = Math.max(1, Number(filters.page ?? 1));
    const limit = Math.min(200, Math.max(1, Number(filters.limit ?? 50)));
    const offset = (page - 1) * limit;

    const rows = await this.dataSource.query<LookupRow[]>(
      `SELECT * FROM ${t} WHERE ${where} ORDER BY category, display_order ASC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset],
    );

    return {
      data: rows.map((r) => this.mapRow(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ─────────────────────────────────────────────────────
   * Find by category — primary dropdown endpoint
   * GET /lookups/:category?schoolId=5&isActive=true
   * ───────────────────────────────────────────────────── */
  async findByCategory(
    category: string,
    filters: { schoolId?: string; isActive?: string },
  ): Promise<(LookupValueDto | null)[]> {
    const t = await this.table();
    const conditions: string[] = [
      'is_deleted = false',
      `UPPER(category) = UPPER($1)`,
    ];
    const params: unknown[] = [category];
    let idx = 2;

    if (filters.isActive !== undefined) {
      const active = filters.isActive === 'true' || filters.isActive === '1';
      conditions.push(`is_active = $${idx++}`);
      params.push(active);
    } else {
      // Default to active only
      conditions.push(`is_active = true`);
    }

    if (filters.schoolId) {
      conditions.push(`(school_id IS NULL OR school_id = $${idx++})`);
      params.push(Number(filters.schoolId));
    } else {
      conditions.push(`school_id IS NULL`);
    }

    const where = conditions.join(' AND ');
    const rows = await this.dataSource.query<LookupRow[]>(
      `SELECT * FROM ${t} WHERE ${where} ORDER BY display_order ASC`,
      params,
    );
    return rows.map((r) => this.mapRow(r));
  }

  /* ─────────────────────────────────────────────────────
   * Find by code — GET /lookups/code/:code
   * ───────────────────────────────────────────────────── */
  async findByCode(
    code: string,
    schoolId?: string,
  ): Promise<LookupValueDto | null> {
    const t = await this.table();
    const conditions = ['is_deleted = false', `LOWER(code) = LOWER($1)`];
    const params: unknown[] = [code];
    let idx = 2;

    if (schoolId) {
      conditions.push(`(school_id IS NULL OR school_id = $${idx++})`);
      params.push(Number(schoolId));
    } else {
      conditions.push(`school_id IS NULL`);
    }

    const rows = await this.dataSource.query<LookupRow[]>(
      `SELECT * FROM ${t} WHERE ${conditions.join(' AND ')} LIMIT 1`,
      params,
    );
    if (!rows[0])
      throw new NotFoundException(`Lookup with code '${code}' not found`);
    return this.mapRow(rows[0]);
  }

  /* ─────────────────────────────────────────────────────
   * Find by ID — GET /lookups/id/:id
   * ───────────────────────────────────────────────────── */
  async findById(id: string): Promise<LookupValueDto | null> {
    const t = await this.table();
    const rows = await this.dataSource.query<LookupRow[]>(
      `SELECT * FROM ${t} WHERE id = $1 AND is_deleted = false LIMIT 1`,
      [Number(id)],
    );
    if (!rows[0]) throw new NotFoundException(`Lookup with id ${id} not found`);
    return this.mapRow(rows[0]);
  }

  /* ─────────────────────────────────────────────────────
   * Get distinct category names
   * ───────────────────────────────────────────────────── */
  async getCategories(schoolId?: string): Promise<string[]> {
    const t = await this.table();
    let sql = `SELECT DISTINCT category FROM ${t} WHERE is_deleted = false`;
    const params: unknown[] = [];

    if (schoolId) {
      sql += ` AND (school_id IS NULL OR school_id = $1)`;
      params.push(Number(schoolId));
    } else {
      sql += ` AND school_id IS NULL`;
    }

    sql += ` ORDER BY category ASC`;
    const rows = await this.dataSource.query<{ category: string }[]>(
      sql,
      params,
    );
    return rows.map((r) => r.category);
  }

  /* ─────────────────────────────────────────────────────
   * Create
   * ───────────────────────────────────────────────────── */
  async create(body: Record<string, unknown>): Promise<LookupValueDto | null> {
    const t = await this.table();
    const result = await this.dataSource.query<LookupRow[]>(
      `INSERT INTO ${t}
        (school_id, category, code, lookup_key, lookup_value, description, display_order, is_system_default, is_active, is_deleted, created_by_id, updated_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, true, false, 1, 1)
       RETURNING *`,
      [
        body['schoolId'] ? Number(body['schoolId']) : null,
        ((body['category'] as string) ?? '').toUpperCase(),
        ((body['code'] as string) ?? '').toUpperCase(),
        body['lookupKey'] ?? body['lookup_key'],
        body['lookupValue'] ?? body['lookup_value'],
        body['description'] ?? null,
        body['displayOrder'] ?? body['display_order'] ?? 0,
      ],
    );
    if (!result[0]) return null;
    return this.mapRow(result[0]);
  }

  /* ─────────────────────────────────────────────────────
   * Update
   * ───────────────────────────────────────────────────── */
  async update(
    id: string,
    body: Record<string, unknown>,
  ): Promise<LookupValueDto | null | { message: string }> {
    const t = await this.table();
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    const fieldMap: [unknown, string][] = [
      [body['lookupValue'] ?? body['lookup_value'], 'lookup_value'],
      [body['lookupKey'] ?? body['lookup_key'], 'lookup_key'],
      [body['description'], 'description'],
      [body['displayOrder'] ?? body['display_order'], 'display_order'],
    ];

    for (const [val, col] of fieldMap) {
      if (val !== undefined) {
        sets.push(`${col} = $${idx++}`);
        params.push(val);
      }
    }

    if (body['isActive'] !== undefined) {
      sets.push(`is_active = $${idx++}`);
      params.push(Boolean(body['isActive']));
    }

    if (sets.length === 0) return { message: 'Nothing to update' };

    sets.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(Number(id));

    const result = await this.dataSource.query<LookupRow[]>(
      `UPDATE ${t} SET ${sets.join(', ')} WHERE id = $${idx} AND is_deleted = false RETURNING *`,
      params,
    );

    if (!result[0])
      throw new NotFoundException(`Lookup with id ${id} not found`);
    return this.mapRow(result[0]);
  }

  /* ─────────────────────────────────────────────────────
   * Soft Delete
   * ───────────────────────────────────────────────────── */
  async softDelete(id: string): Promise<{ message: string }> {
    const t = await this.table();
    await this.dataSource.query(
      `UPDATE ${t} SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [Number(id)],
    );
    return { message: `Lookup ${id} deleted successfully` };
  }

  /* ─────────────────────────────────────────────────────
   * Restore (un-delete)
   * ───────────────────────────────────────────────────── */
  async restore(id: string): Promise<LookupValueDto | null> {
    const t = await this.table();
    const result = await this.dataSource.query<LookupRow[]>(
      `UPDATE ${t} SET is_deleted = false, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [Number(id)],
    );
    if (!result[0])
      throw new NotFoundException(`Lookup with id ${id} not found`);
    return this.mapRow(result[0]);
  }

  /* ─────────────────────────────────────────────────────
   * Activate
   * ───────────────────────────────────────────────────── */
  async activate(id: string): Promise<LookupValueDto | null> {
    const t = await this.table();
    const result = await this.dataSource.query<LookupRow[]>(
      `UPDATE ${t} SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_deleted = false RETURNING *`,
      [Number(id)],
    );
    if (!result[0])
      throw new NotFoundException(`Lookup with id ${id} not found`);
    return this.mapRow(result[0]);
  }

  /* ─────────────────────────────────────────────────────
   * Deactivate
   * ───────────────────────────────────────────────────── */
  async deactivate(id: string): Promise<LookupValueDto | null> {
    const t = await this.table();
    const result = await this.dataSource.query<LookupRow[]>(
      `UPDATE ${t} SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_deleted = false RETURNING *`,
      [Number(id)],
    );
    if (!result[0])
      throw new NotFoundException(`Lookup with id ${id} not found`);
    return this.mapRow(result[0]);
  }
}
