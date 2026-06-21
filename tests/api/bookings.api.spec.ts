import { expect, test } from '@playwright/test';

test.describe('api - bookings', () => {
  test('bloqueia POST sem autenticacao', async ({ request }) => {
    const response = await request.post('/api/bookings', { data: {} });
    expect([401, 403]).toContain(response.status());
  });

  test('permite consulta publica apenas com public=true', async ({ request }) => {
    const response = await request.get('/api/bookings?public=true');
    expect(response.ok()).toBeTruthy();
  });

  test('retorna 400 para JSON/dados invalidos', async ({ request }) => {
    test.fixme(true, 'Implementar com sessao autenticada e payload invalido controlado.');
  });

  test('retorna conflito para horario ocupado', async ({ request }) => {
    test.fixme(true, 'Depende de seed com reserva conflitante.');
  });
});
