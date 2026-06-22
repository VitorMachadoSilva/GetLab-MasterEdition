import { apiError } from '@/lib/api-response';

export const DEMO_WRITE_BLOCK_MESSAGE =
  'Perfil DEMO possui acesso somente para visualização. Nenhuma alteração foi realizada.';

export const isDemoRole = (role: unknown) => role === 'DEMO';

export const canReadAdminViews = (role: unknown) => role === 'ADMIN' || role === 'DEMO';

export const demoWriteBlocked = () => apiError(DEMO_WRITE_BLOCK_MESSAGE, { status: 403 });
