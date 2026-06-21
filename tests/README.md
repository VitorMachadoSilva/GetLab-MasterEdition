# Testes Automatizados

Estrutura proposta para a automação do GetLab.

## Pastas

- `e2e/`: fluxos completos pela interface.
- `api/`: validações diretas das rotas de API.
- `fixtures/`: dados fixos usados nos testes.
- `support/`: helpers de login, navegação, screenshots e ambiente.

## Comandos previstos

- `npm run test:e2e`
- `npm run test:e2e:ui`
- `npm run test:e2e:headed`
- `npm run test:api`
- `npm run test:visual`
- `npm run test:report`
- `npm run screenshots:organize`

Antes de executar, instalar a dependência de testes:

```bash
npm install -D @playwright/test
npx playwright install
```

Também é recomendado usar um banco de teste separado e definir as variáveis:

- `E2E_BASE_URL`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `E2E_PROFESSOR_EMAIL`
- `E2E_PROFESSOR_PASSWORD`
- `E2E_PROFESSOR_2_EMAIL`
- `E2E_PROFESSOR_2_PASSWORD`
- `E2E_STUDENT_EMAIL`
- `E2E_STUDENT_PASSWORD`
