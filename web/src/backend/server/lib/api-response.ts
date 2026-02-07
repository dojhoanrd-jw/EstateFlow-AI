import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError } from './api-error';
import { ServiceError } from './service-error';

interface SuccessPayload<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export function apiSuccess<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  const body: SuccessPayload<T> = { data };
  if (meta) body.meta = meta;
  return NextResponse.json(body, { status });
}

export function apiCreated<T>(data: T) {
  return apiSuccess(data, 201);
}

export function apiDeleted() {
  return new NextResponse(null, { status: 204 });
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code } },
      { status: error.statusCode },
    );
  }

  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code } },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    const issues = error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));

    return NextResponse.json(
      { error: { message: 'Validation failed', code: 'VALIDATION_ERROR', issues } },
      { status: 400 },
    );
  }

  console.error('[API] Unhandled error:', error);

  return NextResponse.json(
    { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
    { status: 500 },
  );
}
