import { expect, test } from '@playwright/test';

test.describe('api - rooms', () => {
  test('bloqueia criacao de sala sem autenticacao', async ({ request }) => {
    const response = await request.post('/api/rooms', { data: {} });
    expect([401, 403]).toContain(response.status());
  });

  test('valida dados obrigatorios de sala', async ({ request }) => {
    test.fixme(true, 'Implementar com sessao admin autenticada.');
  });

  test('salva predio vazio como nao informado', async ({ request }) => {
    test.fixme(true, 'Implementar com sessao admin e banco de teste.');
  });
});
