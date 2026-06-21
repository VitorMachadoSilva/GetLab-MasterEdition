import { expect, test } from '@playwright/test';

test.describe('api - users', () => {
  test('bloqueia listagem sem autenticacao', async ({ request }) => {
    const response = await request.get('/api/users');
    expect([401, 403]).toContain(response.status());
  });

  test('bloqueia criacao de usuario sem autenticacao', async ({ request }) => {
    const response = await request.post('/api/users', { data: {} });
    expect([401, 403]).toContain(response.status());
  });

  test('valida email por tipo de usuario', async ({ request }) => {
    test.fixme(true, 'Implementar com sessao admin autenticada.');
  });

  test('bloqueia CPF duplicado', async ({ request }) => {
    test.fixme(true, 'Depende de seed com usuario existente.');
  });
});
