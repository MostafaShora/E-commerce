import { HttpErrorResponse } from '@angular/common/http';

export type ApiError = {
  message: string;
  status?: number;
  error?: string;
  field?: string | null;
  original?: unknown;
};

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof HttpErrorResponse) {
    const payload = error.error as Record<string, unknown> | undefined;
    return {
      message:
        (typeof payload?.['message'] === 'string' && payload['message']) ||
        error.message ||
        'Something went wrong.',
      status: error.status,
      error:
        typeof payload?.['error'] === 'string' ? payload['error'] : undefined,
      field:
        typeof payload?.['field'] === 'string' ? payload['field'] : undefined,
      original: error,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const payload = error as Record<string, unknown>;
    const message =
      typeof payload['message'] === 'string' && payload['message']
        ? payload['message']
        : 'Something went wrong.';

    return {
      message,
      error: typeof payload['error'] === 'string' ? payload['error'] : undefined,
      field: typeof payload['field'] === 'string' ? payload['field'] : undefined,
      original: error,
    };
  }

  return {
    message: 'Something went wrong.',
    original: error,
  };
}
