import { NextResponse } from 'next/server';

type ApiErrorOptions = {
  status: number;
  code?: string;
  details?: unknown;
};

const defaultCodeByStatus: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  500: 'INTERNAL_ERROR',
};

export function apiError(message: string, options: ApiErrorOptions) {
  const payload: {
    ok: false;
    error: string;
    message: string;
    statusCode: number;
    code: string;
    details?: unknown;
  } = {
    ok: false,
    error: message,
    message,
    statusCode: options.status,
    code: options.code || defaultCodeByStatus[options.status] || 'REQUEST_ERROR',
  };

  if (options.details !== undefined) {
    payload.details = options.details;
  }

  return NextResponse.json(payload, { status: options.status });
}

