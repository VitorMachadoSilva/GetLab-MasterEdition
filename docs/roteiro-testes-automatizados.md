# Roteiro de Testes Automatizados - GetLab

Este roteiro define os testes automatizados recomendados para validar a aplicação inteira do GetLab. A ideia é começar pelos fluxos críticos de apresentação e depois ampliar para regras, erros e responsividade.

## Estratégia

- **Testes E2E com Playwright**: validar login, navegação, criação de reservas, aprovação, rejeição, display público e responsividade.
- **Testes de API**: validar regras de negócio em `/api/bookings`, `/api/rooms`, `/api/users` e autenticação/autorização.
- **Testes unitários ou de integração leve**: validar helpers de erro, validação de sala, validação de usuário e cálculo de disponibilidade.
- **Testes visuais básicos**: capturar telas principais em desktop e mobile para evitar regressões grosseiras.

## Massa de Dados Recomendada

Criar dados fixos para testes, preferencialmente em banco de teste:

- Admin: `admin@fmpsc.edu.br`
- Professor: `professor.teste@fmpsc.edu.br`
- Professor secundário: `professor2.teste@fmpsc.edu.br`
- Aluno: `aluno.teste@aluno.fmpsc.edu.br`
- Sala disponível: `Laboratório Teste 01`, capacidade 30
- Sala pequena: `Sala Pequena Teste`, capacidade 10
- Reserva aprovada existente: hoje ou próxima data útil, 08:00-10:00
- Reserva pendente existente: próxima data útil, 10:00-12:00

## Prioridade 1 - Fluxos Críticos

### 1. Autenticação e sessão

- Usuário sem login acessa `/dashboard` e é redirecionado para `/login`.
- Usuário sem login acessa `/admin` e é redirecionado para `/login`.
- Usuário sem login acessa `/professor/nova-reserva` e é redirecionado para `/login`.
- Login com professor válido entra no painel correto.
- Login com admin válido entra no painel correto.
- Login com senha/CPF inválido mostra erro e permanece no login.
- Usuário já logado não precisa fazer login duas vezes.
- Logout encerra a sessão e protege as rotas privadas novamente.

### 2. Autorização por tipo de conta

- Professor tentando acessar `/admin` recebe tela de acesso indisponível/not found.
- Aluno tentando acessar área administrativa recebe tela de acesso indisponível/not found.
- Admin consegue acessar `/admin`, `/admin/salas` e `/admin/usuarios`.
- Professor consegue acessar `/professor/nova-reserva` e `/professor/minhas-reservas`.
- Botão de voltar da página not found retorna para a página anterior ou fluxo seguro.

### 3. Display público

- `/display` abre sem login.
- `/display` carrega reservas aprovadas usando API pública.
- Reservas pendentes/rejeitadas/canceladas não aparecem no display.
- Display mostra estado vazio quando não há reservas aprovadas.
- Falha na API do display mostra estado de erro compreensível.

### 4. Criação de reserva pelo professor

- Professor cria solicitação válida para sala disponível.
- Reserva criada aparece como pendente em "Minhas Reservas".
- Professor não consegue criar reserva sem sala.
- Professor não consegue criar reserva sem data.
- Professor não consegue criar reserva com horário inicial maior ou igual ao final.
- Professor não consegue reservar data passada.
- Professor não consegue reservar horário já ocupado por reserva aprovada.
- Professor não consegue reservar horário conflitante com reserva pendente, se esta for a regra desejada.
- Professor não consegue reservar sala com número de alunos maior que a capacidade.
- Erros da API aparecem como mensagem clara na tela.

### 5. Aprovação e rejeição pelo admin

- Admin visualiza solicitações pendentes.
- Admin aprova uma solicitação pendente.
- Solicitação aprovada deixa a lista de pendentes e aparece como aprovada.
- Admin rejeita uma solicitação informando motivo.
- Admin não consegue rejeitar sem motivo.
- Admin não consegue aprovar reserva que conflita com reserva já aprovada.
- Paginação de pendentes mostra no máximo o limite configurado por página.
- Botões anterior/próxima funcionam e não aparecem habilitados indevidamente.

## Prioridade 2 - Gestão Administrativa

### 6. Gerenciar salas

- Admin cria sala válida.
- Campo "Prédio" vazio é salvo como "Não informado".
- Admin não consegue criar sala sem nome.
- Admin não consegue criar sala sem tipo.
- Admin não consegue criar sala com capacidade menor que 1.
- Equipamentos digitados são salvos e exibidos como chips.
- Admin edita nome, capacidade, prédio, andar e equipamentos.
- Admin exclui sala sem reservas associadas.
- Admin recebe erro compreensível ao tentar excluir sala com reservas associadas, se a regra impedir exclusão.
- Busca/filtros de salas continuam funcionando após cadastro, edição e exclusão.
- Tela de salas funciona em mobile sem quebrar layout.

### 7. Gerenciar usuários

- Admin cria professor com email `@fmpsc.edu.br`.
- Admin cria aluno com email `@aluno.fmpsc.edu.br`.
- Admin não consegue criar usuário com email fora da regra do perfil.
- Admin não consegue criar usuário com CPF inválido.
- Admin não consegue criar usuário com email duplicado.
- Admin não consegue criar usuário com CPF duplicado.
- Admin edita nome/departamento de usuário.
- Admin consegue editar usuário admin interno sem alterar CPF especial.
- Busca por nome, email, CPF e departamento filtra corretamente.
- Filtro por tipo mostra somente o perfil selecionado.
- Tela de usuários funciona em mobile sem quebrar layout.

### 8. Perfil do usuário

- Usuário logado visualiza seus dados corretos.
- Usuário altera nome/departamento permitido.
- Usuário comum não consegue alterar role, email ou CPF por payload manual.
- Erros de atualização aparecem de forma clara.
- Perfil em mobile mantém botões e campos acessíveis.

## Prioridade 3 - Regras e Erros de API

### 9. `/api/bookings`

- `GET /api/bookings` sem login retorna erro, exceto quando `public=true`.
- `GET /api/bookings?public=true` retorna somente dados públicos permitidos.
- Professor logado vê apenas suas próprias reservas quando aplicável.
- Professor não consegue consultar reservas de outro professor usando `professorId`.
- `POST` sem autenticação retorna 401.
- `POST` com sala inexistente retorna 404 ou erro de validação.
- `POST` com JSON inválido retorna 400.
- `POST` com conflito retorna 409.
- `POST` com dados válidos retorna 201 e corpo esperado.

### 10. `/api/bookings/[id]`

- ID inválido retorna 400.
- Reserva inexistente retorna 404.
- Professor cancela própria reserva pendente com motivo.
- Professor não cancela reserva de outro professor.
- Admin aprova reserva pendente.
- Admin rejeita reserva pendente com motivo.
- Admin não envia status inválido.
- Rejeição sem motivo retorna 400.

### 11. `/api/rooms`

- Usuário não admin não cria sala.
- `POST` com dados válidos cria sala.
- `POST` com dados inválidos retorna 400 com mensagem útil.
- `PATCH` atualiza campos permitidos.
- `DELETE` respeita regra de reservas associadas.
- Erros seguem formato padronizado.

### 12. `/api/users`

- Usuário comum acessa apenas seus próprios dados quando aplicável.
- Admin lista usuários.
- Usuário não admin não lista todos os usuários.
- Admin cria usuário válido.
- Admin não cria duplicados.
- Admin edita usuário válido.
- Usuário comum não muda seu próprio perfil para admin.
- ID inválido retorna 400.
- Erros seguem formato padronizado.

## Prioridade 4 - Multi-login e Segurança

### 13. Sessão ativa

- Login na mesma conta em uma nova instância encerra a sessão antiga.
- Sessão antiga recebe aviso ou é redirecionada ao detectar encerramento.
- Login em contas diferentes, em instâncias diferentes, funciona ao mesmo tempo.
- Troca de sessão não afeta outro usuário.
- Token/sessão inválida não acessa rotas privadas.

### 14. Validação contra manipulação manual

- Professor não consegue aprovar reserva via chamada manual à API.
- Professor não consegue criar reserva em nome de outro professor.
- Aluno não consegue criar reserva, se a regra do sistema permitir apenas professor.
- Usuário não logado não consegue chamar APIs privadas.
- Payload com campos extras não altera dados sensíveis.

## Prioridade 5 - Experiência e Responsividade

### 15. Responsividade visual

Validar em pelo menos:

- Desktop: 1366x768
- Tablet: 768x1024
- Mobile: 390x844

Telas:

- Login
- Dashboard
- Nova reserva
- Minhas reservas
- Admin pendências
- Admin salas
- Admin usuários
- Perfil
- Display público
- Not found/acesso indisponível

Critérios:

- Sem conteúdo cortado.
- Sem botões sobrepostos.
- Modais cabem na tela ou têm rolagem interna.
- Tabelas viram cards ou mantêm rolagem horizontal aceitável.
- Mensagens de erro aparecem próximas ao fluxo.

### 16. Estados vazios, carregamento e erro

- Lista de reservas vazia.
- Lista de salas vazia.
- Lista de usuários vazia.
- Falha ao carregar reservas.
- Falha ao carregar salas.
- Falha ao carregar usuários.
- Botões ficam desabilitados durante salvamento.
- Toasts não escondem informação essencial.

## Ordem Sugerida de Implementação

1. Criar configuração base do Playwright.
2. Criar helpers de login para admin, professor e aluno.
3. Criar rotina de seed/limpeza para banco de teste.
4. Implementar testes de autenticação e autorização.
5. Implementar fluxo de criação de reserva.
6. Implementar aprovação/rejeição pelo admin.
7. Implementar display público.
8. Implementar gestão de salas.
9. Implementar gestão de usuários.
10. Implementar testes de API para regras críticas.
11. Adicionar capturas visuais de desktop/mobile.
12. Integrar tudo em comando único de validação antes da apresentação.

## Critério de Pronto

Antes da apresentação, o ideal é conseguir rodar um comando único que confirme:

- Build passa.
- Login funciona para admin e professor.
- Rotas privadas estão protegidas.
- Professor cria solicitação válida.
- Professor não cria conflito.
- Admin aprova/rejeita corretamente.
- Display público mostra reservas aprovadas sem login.
- Telas principais abrem em desktop e mobile sem quebra visual.
