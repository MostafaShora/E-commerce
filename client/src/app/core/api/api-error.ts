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
    const rawMessage = payload?.['message'];
    return {
      message: formatMessage(rawMessage) || error.message || 'Something went wrong.',
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
    const message = formatMessage(payload['message']) || 'Something went wrong.';

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

function formatMessage(value: unknown): string | null {
  if (typeof value === 'string' && value) return value;
  if (Array.isArray(value)) {
    const messages = value.filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );
    return messages.length > 0 ? messages.join(', ') : null;
  }
  return null;
}
