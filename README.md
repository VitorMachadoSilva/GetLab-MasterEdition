# 🎓 Sistema de Reservas FMPSC - Versão 4.0

Sistema completo e refinado de gestão de reservas de salas e laboratórios.

## 🆕 Novidades da Versão 4.0

### ✅ Correções Críticas
1. **Display Público** - Página `/display` recriada para TVs/monitores
2. **Middleware Corrigido** - Proteção de rotas funcionando perfeitamente
3. **Filtro de Data** - Dashboard agora permite ver outros dias além de hoje
4. **Feedback Melhorado** - Mensagens específicas para email/CPF duplicado

### 🎨 Melhorias de UX
- Toast com mensagens mais específicas e claras
- Botão "Hoje" para voltar rapidamente à data atual
- Display público com atualização automática a cada minuto
- Validações com feedback visual instantâneo

---

## 📱 Todas as Páginas do Sistema

| Rota | Descrição | Acesso | Autenticação |
|------|-----------|--------|--------------|
| `/login` | Autenticação | Todos | Não |
| `/dashboard` | Reservas (com filtro de data) | Todos | Sim |
| `/display` | Display público para TVs | Todos | Não |
| `/professor/nova-reserva` | Criar reserva | Prof/Admin | Sim |
| `/professor/minhas-reservas` | Minhas reservas | Prof/Admin | Sim |
| `/perfil` | Ver/Editar perfil | Todos | Sim |
| `/admin` | Dashboard administrativo | Admin | Sim |
| `/admin/usuarios` | Gerenciar usuários | Admin | Sim |
| `/admin/salas` | Gerenciar salas | Admin | Sim |

---

## 🚀 Instalação Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Ambiente

Crie o arquivo `.env` (copie de `.env.example`):

```env
# Neon PostgreSQL Connection String
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Gere com: openssl rand -base64 32
NEXTAUTH_SECRET="sua-chave-secreta"

NEXTAUTH_URL="http://localhost:3000"

# Credenciais Admin
ADMIN_EMAIL="admin@fmpsc.edu.br"
ADMIN_PASSWORD="Admin@2024"
```

### 3. Criar Banco de Dados
```bash
npm run db:generate
npm run db:push
```

### 4. Iniciar
```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 👤 Primeiro Acesso

### Login como Administrador
```
Email: admin@fmpsc.edu.br
Senha: Admin@2024 (ou a que você configurou)
```

Após login, você terá acesso total!

---

## ✅ Funcionalidades Completas

### 🎯 Validações de Reserva
- ✅ **24h antecedência** - Não permite reservar para o mesmo dia
- ✅ **1h mínima** - Duração mínima de 1 hora
- ✅ **Detecção de conflitos** - Verifica horários já reservados
- ✅ **Validação de capacidade** - Verifica se sala comporta os alunos
- ✅ **Campos em vermelho** - Feedback visual de erros

### 📊 Dashboard Inteligente
- ✅ Filtro de data (ver qualquer dia)
- ✅ Botão "Hoje" para retornar rapidamente
- ✅ Atualização em tempo real
- ✅ Aulas em andamento destacadas
- ✅ Próximas aulas listadas

### 📺 Display Público
- ✅ Tela cheia otimizada para TVs
- ✅ Atualização automática (1min)
- ✅ Aula atual em destaque
- ✅ Próximas 4 aulas
- ✅ Status de todas as salas
- ✅ Relógio em tempo real

### 👥 Gerenciamento
- ✅ CRUD completo de usuários
- ✅ CRUD completo de salas
- ✅ Aprovação/rejeição de reservas
- ✅ Perfil editável (Prof/Admin)

---

## 🎨 Cores FMPSC

Sistema usa a identidade visual oficial:
- **Azul Principal**: `#1a5490`
- **Azul Secundário**: `#336699`

---

## 📋 Regras de Negócio

### Para Criar Reserva:

**❌ ERRO se:**
- Data for hoje (precisa 24h antecedência)
- Duração menor que 1 hora
- Conflito com outra reserva
- Sala não comporta quantidade de alunos

**✅ SUCESSO se:**
- Data for amanhã ou depois
- Duração de 1h ou mais
- Sem conflitos
- Capacidade adequada

### Exemplos:

```
❌ Hoje 14:00-15:00
   → "Mínimo 24h de antecedência"

❌ Amanhã 14:00-14:30
   → "Duração mínima: 1 hora"

✅ Amanhã 14:00-16:00
   → Aprovado! (vai para aprovação do admin)
```

---

## 👥 Hierarquia de Usuários

### ALUNO
- ✅ Ver reservas do dia (com filtro)
- ✅ Ver display público
- ✅ Ver próprio perfil
- ❌ Criar reservas
- ❌ Editar perfil

### PROFESSOR
- ✅ Tudo do aluno +
- ✅ Criar solicitações de reserva
- ✅ Ver minhas reservas
- ✅ Histórico completo
- ✅ Editar meu perfil
- ❌ Aprovar reservas

### ADMINISTRADOR
- ✅ Tudo +
- ✅ Aprovar/Rejeitar reservas
- ✅ Gerenciar usuários
- ✅ Gerenciar salas
- ✅ Acesso total ao sistema
- ✅ Reservas auto-aprovadas

---

## 🗄️ Adicionar Dados

### Via Prisma Studio (Recomendado)
```bash
npm run db:studio
# Abre em http://localhost:5555
```

### Via Admin Panel
1. Login como admin
2. Ir em `/admin/usuarios` ou `/admin/salas`
3. Clicar em "Novo"

### Via SQL
```sql
-- Professor
INSERT INTO users (id, email, cpf, name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'joao.silva@fmpsc.edu.br',
  '12345678900',
  'Prof. João Silva',
  'PROFESSOR',
  NOW(),
  NOW()
);

-- Sala
INSERT INTO rooms (id, name, type, capacity, building, floor, equipment, active, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'Lab de Informática 1',
  'LABORATORIO',
  40,
  'Bloco A',
  1,
  ARRAY['Computadores', 'Projetor'],
  true,
  NOW(),
  NOW()
);
```

---

## 🛠️ Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento (localhost:3000)
npm run build        # Build para produção
npm run start        # Rodar produção
npm run db:studio    # Interface visual do banco
npm run db:generate  # Gerar Prisma Client
npm run db:push      # Atualizar schema no banco
npm run lint         # Verificar código
```

---

## 🔔 Notificações (Toasts)

Duração: **5 segundos** (com botão X para fechar)

### Tipos de Toast:
- ✅ **Sucesso** - Login, reserva criada, aprovada, etc
- ❌ **Erro** - Validações, conflitos, erros de servidor
- ⚠️ **Aviso** - Reserva rejeitada, alterações
- ℹ️ **Info** - Informações gerais

### Mensagens Específicas:
- "❌ Este email já está cadastrado"
- "❌ Este CPF já está cadastrado"
- "✅ Reserva criada com sucesso!"
- "⚠️ Mínimo 24h de antecedência"
- "⚠️ Duração mínima: 1 hora"

---

## 🌐 Deploy (Produção)

### Vercel (Recomendado)
1. Push para GitHub
2. Importar no Vercel
3. Adicionar variáveis de ambiente (`.env`)
4. Deploy automático!

### Outras Plataformas
- Railway
- Render
- AWS/Azure/GCP

**Importante:** Configure as variáveis de ambiente!

---

## 🆘 Troubleshooting

### Erro de conexão com banco
→ Verifique `DATABASE_URL` no `.env`
→ Teste conexão no Neon Console

### Não consigo fazer login
→ Verifique se usuário existe (`npm run db:studio`)
→ Confirme CPF correto (sem pontos/traços)

### Página em branco
→ Veja console do navegador (F12)
→ Veja logs do terminal
→ Tente `rm -rf .next && npm run dev`

### Display não atualiza
→ Verifique se há reservas aprovadas
→ Aguarde 1 minuto (atualização automática)

---

## 📊 Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para PostgreSQL
- **NextAuth.js** - Autenticação
- **Tailwind CSS** - Estilização
- **Neon** - PostgreSQL serverless
- **React Hot Toast** - Notificações
- **Lucide Icons** - Ícones

---

## ✅ Checklist de Implementação v4.0

- [x] Display público recriado
- [x] Middleware corrigido
- [x] Filtro de data no dashboard
- [x] Feedback melhorado (email/CPF)
- [x] Toast 5s + botão X
- [x] Validações 24h + 1h
- [x] Campos vermelhos
- [x] CRUD usuários
- [x] CRUD salas
- [x] Página perfil
- [x] Loading states
- [x] Cores FMPSC
- [x] Design refinado

---

## 📝 Changelog

### v4.0 (Atual)
- ✅ Display público recriado
- ✅ Filtro de data no dashboard
- ✅ Middleware revisado
- ✅ Feedback de erros melhorado

### v3.0
- Validações 24h + 1h
- CRUD completo
- Cores FMPSC
- Design moderno

### v2.0
- Autenticação
- Banco de dados
- Sistema base

---

**Sistema 100% Funcional - Versão 4.0** 🎉  
Pronto para produção!
