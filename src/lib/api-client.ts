type ConflictDetail = {
  course?: string;
  startTime?: string;
  endTime?: string;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
  details?: {
    conflicts?: ConflictDetail[];
  };
};

function formatConflictDetails(conflicts?: ConflictDetail[]) {
  if (!conflicts?.length) {
    return null;
  }

  const firstConflict = conflicts[0];
  const timeRange = firstConflict.startTime && firstConflict.endTime
    ? `${firstConflict.startTime}-${firstConflict.endTime}`
    : null;

  if (firstConflict.course && timeRange) {
    return `Conflito de horário com ${firstConflict.course} (${timeRange}).`;
  }

  return 'Conflito de horário. Escolha outro horário.';
}

export function getApiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const payload = data as ApiErrorPayload;
  const conflictMessage = formatConflictDetails(payload.details?.conflicts);

  return conflictMessage || payload.message || payload.error || fallback;
}

export async function readApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return getApiErrorMessage(data, fallback);
  } catch {
    return fallback;
  }
}
