# Testes de performance

Esta pasta valida se as principais telas e APIs otimizadas continuam respondendo dentro de limites aceitaveis.

## Comando

```bash
npm run test:perf
```

## Variaveis opcionais

- `PERF_API_MAX_MS`: limite maximo por chamada de API. Padrao: `2500`.
- `PERF_PAGE_MAX_MS`: limite maximo para carregar uma pagina protegida. Padrao: `6000`.
- `E2E_BASE_URL`: URL do ambiente testado. Padrao do projeto: `http://localhost:3001`.

Os testes fazem login com as mesmas credenciais usadas nos testes E2E:

- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

## O que estes testes protegem

- APIs paginadas devem devolver apenas a quantidade solicitada.
- Respostas devem manter o formato esperado pela interface.
- Telas administrativas principais devem abrir sem erro e dentro do tempo limite.
