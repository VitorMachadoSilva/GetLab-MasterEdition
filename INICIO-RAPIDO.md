# 🚀 GUIA DE INÍCIO RÁPIDO

## ⚡ 4 Passos para Começar

### 1️⃣ Instalar Dependências
```bash
npm install
```

### 2️⃣ Configurar Banco de Dados

Crie o arquivo `.env` na raiz do projeto (copie de `.env.example`):

```env
DATABASE_URL="sua-connection-string-do-neon"
NEXTAUTH_SECRET="resultado-de: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@fmpsc.edu.br"
ADMIN_PASSWORD="Admin@2024"
```

**Onde pegar a DATABASE_URL?**
1. Acesse [Neon Console](https://console.neon.tech/)
2. Crie um projeto (se não tiver)
3. Copie a **Connection String**

**Como gerar NEXTAUTH_SECRET?**
```bash
openssl rand -base64 32
```

### 3️⃣ Criar Tabelas
```bash
npm run db:generate
npm run db:push
```

### 4️⃣ Rodar o Sistema
```bash
npm run dev
```

Abra: **http://localhost:3000**

---

## 👤 Primeiro Login

### Como Admin
```
Email: admin@fmpsc.edu.br
Senha: Admin@2024 (ou a que você configurou no .env)
```

Após login, você terá acesso total ao sistema!

---

## 👥 Adicionar Usuários de Teste

### Opção 1: Via Interface (FÁCIL)

```bash
npm run db:studio
```

Abre em `http://localhost:5555`

1. Clique em **"User"**
2. Clique em **"Add record"**
3. Preencha:
   - `email`: joao.silva@fmpsc.edu.br
   - `cpf`: 12345678900
   - `name`: Prof. João Silva
   - `role`: PROFESSOR
4. **Save**

### Opção 2: Via Admin

1. Faça login como admin
2. Vá em `/admin/usuarios`
3. Clique em "Novo Usuário"
4. Preencha o formulário

---

## 🏢 Adicionar Salas

### Via Admin
1. Login como admin
2. Vá em `/admin/salas`
3. Clique em "Nova Sala"
4. Preencha os dados

---

## 📱 Páginas Disponíveis

| URL | Descrição | Acesso |
|-----|-----------|--------|
| `/login` | Login | Todos |
| `/dashboard` | Reservas do dia | Todos |
| `/professor/nova-reserva` | Criar reserva | Prof/Admin |
| `/professor/minhas-reservas` | Minhas reservas | Prof/Admin |
| `/perfil` | Meu perfil | Todos |
| `/admin` | Dashboard admin | Admin |
| `/admin/usuarios` | Gerenciar usuários | Admin |
| `/admin/salas` | Gerenciar salas | Admin |

---

## ✅ Regras do Sistema

### Criar Reserva

**Validações:**
- ✅ Mínimo 24h de antecedência
- ✅ Duração mínima de 1 hora
- ✅ Verificação de conflitos
- ✅ Validação de capacidade

**Erros Comuns:**
- ❌ Tentar reservar para hoje → BLOQUEADO
- ❌ Duração menor que 1h → BLOQUEADO
- ✅ Reservar para amanhã 14h-16h → OK!

---

## 🎨 Cores FMPSC

O sistema usa as cores oficiais:
- **Azul Principal**: #1a5490
- **Azul Secundário**: #336699

---

## 🛠️ Scripts Úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run start        # Rodar produção
npm run db:studio    # Ver banco de dados
npm run db:generate  # Gerar Prisma Client
npm run db:push      # Atualizar schema
```

---

## 🆘 Problemas?

**Erro de conexão com banco?**
→ Verifique `DATABASE_URL` no `.env`

**Não consigo fazer login?**
→ Confirme que o usuário existe (`npm run db:studio`)

**Validações não funcionam?**
→ Limpe o cache: `rm -rf .next && npm run dev`

---

**Pronto para usar!** 🎉
