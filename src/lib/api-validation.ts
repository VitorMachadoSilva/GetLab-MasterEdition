export async function readJsonObject(request: Request) {
  try {
    const data = await request.json();

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {
        ok: false as const,
        error: 'Corpo da requisição inválido',
      };
    }

    return {
      ok: true as const,
      data: data as Record<string, unknown>,
    };
  } catch {
    return {
      ok: false as const,
      error: 'JSON inválido',
    };
  }
}

export function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isValidCuid(value: unknown): value is string {
  return typeof value === 'string' && /^c[a-z0-9]{20,}$/i.test(value);
}
