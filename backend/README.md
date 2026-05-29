# Nexo API

API REST para plataforma de reviews e social de jogos. Autenticação JWT, perfis públicos, feed social, sistema de busca, moderação e dashboard administrativo.

## Funcionalidades

- **Autenticação** — registro, login, refresh token, recuperação de senha
- **Perfil próprio** — gerenciar nome, username, bio, avatar e banner
- **Upload de imagens** — avatar e banner via multipart, armazenamento local com `@fastify/static`
- **Perfis públicos** — consultar usuários, reviews, estatísticas e listas de jogos
- **Social** — seguir/deixar de seguir, lista de seguidores e seguindo, feed de reviews
- **Busca textual** — busca por nome/username com índice `pg_trgm` (O(log n))
- **Módulo Admin** — dashboard de métricas, CRUD de usuários, bloqueio, moderação de reviews, denúncias
- **Master** — promover/demover/banir usuários
- **Notificações** — listar, marcar como lidas, deletar
- **Rate limit** — 40 requisições/minuto global
- **Documentação Swagger** — rota `/docs`

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22 + TypeScript |
| Framework | Fastify 4 |
| ORM | Prisma 7 |
| Banco | PostgreSQL 16 |
| Autenticação | JWT (`@fastify/jwt`) + Argon2 |
| Upload | `@fastify/multipart` + `@fastify/static` |
| Testes | Vitest |
| Formatação | Biome |
| Container | Docker + docker-compose |
| CI | Azure Pipelines |

## Arquitetura

```mermaid
graph TB
    USR["👤 Usuário"]

    subgraph "📱 Mobile"
        APP["App React Native"]
    end

    subgraph "☁️ Azure"
        API["Backend API<br>Fastify"]
        MOD["Módulos<br>Auth · Me · Users · Social<br>Search · Admin · Master<br>Notification · Games"]
    end

    subgraph "💾 Dados"
        DB[("PostgreSQL<br>Prisma ORM")]
        ST["Blob Storage<br>avatars / banners"]
    end

    USR --> APP
    APP -->|"HTTPS · REST"| API
    API --> MOD
    MOD --> DB
    MOD --> ST
```
```

## Pré-requisitos

- Node.js 22+
- PostgreSQL 16
- Docker (opcional)

## Como rodar

### Local (sem Docker)

```bash
# 1. Clonar e instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env .env
# editar .env com suas credenciais

# 3. Criar banco PostgreSQL
createdb NexoAPI

# 4. Rodar migrations + seeds
npx prisma migrate deploy
npm run sync:seeds

# 5. Iniciar servidor
npm run dev
```

### Com Docker

```bash
# 1. Configurar .env.docker (já vem com valores padrão)
# 2. Buildar e subir
docker compose up -d --build
# 3. Rodar seeds dentro do container
docker exec nexo-api npx tsx prisma/seeds/index.ts
```

A API estará em **https://localhost:3000** e o Swagger em **https://localhost:3000/docs**.

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `PORT` | Porta do servidor | `3000` |
| `HOST` | Host do servidor | `0.0.0.0` |
| `DATABASE_URL` | String de conexão PostgreSQL | — |
| `SECRET` | Chave secreta JWT | — |
| `TOKEN_TYPE` | Tipo do token | `Bearer` |
| `TOKEN_EXPIRES` | Expiração do token | `15m` |
| `REFRESH_TOKEN_EXPIRES` | Expiração do refresh | `7d` |
| `MASTER_EMAIL` | Email do usuário master inicial | — |
| `MASTER_PASSWORD` | Senha do usuário master inicial | — |

## Endpoints

### Auth (`/api/auth`)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/register` | Registrar novo usuário | — |
| POST | `/login` | Login | — |
| POST | `/refresh` | Renovar refresh token | — |
| POST | `/logout` | Logout | Bearer |
| POST | `/forgot-password` | Solicitar reset de senha | — |
| POST | `/reset-password` | Resetar senha com token | — |

### Me (`/api/me`)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/` | Dados do perfil próprio | Bearer |
| PUT | `/` | Atualizar perfil (JSON ou multipart) | Bearer |
| PUT | `/password` | Alterar senha | Bearer |
| DELETE | `/` | Deletar conta | Bearer |

### Users (`/api/users`)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/:username` | Perfil público | Bearer |
| GET | `/:username/reviews` | Reviews do usuário | Bearer |
| GET | `/:username/stats` | Estatísticas do usuário | — |
| GET | `/:username/lists` | Listas públicas de jogos | Bearer |

### Social (`/api/social`)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/:username/follow` | Seguir usuário | Bearer |
| DELETE | `/:username/follow` | Deixar de seguir | Bearer |
| GET | `/:username/followers` | Seguidores | Bearer |
| GET | `/:username/following` | Seguindo | Bearer |
| GET | `/feed` | Feed de reviews | Bearer |

### Search (`/api/search`)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/users?q=` | Buscar usuários por nome/username | — |

### Admin (`/api/admin`)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/dashboard` | Métricas do sistema | Admin |
| GET | `/user/search?email=` | Buscar usuário por email | Admin |
| GET | `/user-all` | Listar todos usuários | Admin |
| GET | `/user/admin` | Listar admins | Admin |
| GET | `/user/stats` | Estatísticas de usuários | Admin |
| GET | `/users/:id` | Detalhes do usuário | Admin |
| POST | `/users/:id/block` | Bloquear usuário | Admin |
| DELETE | `/users/:id/block` | Desbloquear usuário | Admin |
| DELETE | `/users/:id` | Deletar usuário | Admin |
| GET | `/reviews` | Reviews para moderação | Admin |
| DELETE | `/reviews/:id` | Deletar review | Admin |
| GET | `/reports` | Denúncias pendentes | Admin |
| PATCH | `/reports/:id/resolve` | Resolver denúncia | Admin |

### Master (`/api/master`)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| PATCH | `/user/:id/promote` | Promover para admin | Master |
| PATCH | `/user/:id/demote` | Rebaixar para user | Master |
| PATCH | `/user/:id/ban` | Banir usuário | Master |

### Notification (`/api/notification`)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/` | Listar notificações | Bearer |
| PATCH | `/read-all` | Marcar todas como lidas | Bearer |
| DELETE | `/delete/:id` | Deletar notificação | Bearer |
| DELETE | `/delete-all` | Deletar todas notificações | Bearer |

### Health (`/api/verify`)

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/health` | Status da API | — |
| GET | `/ping` | Ping | — |

## Upload de Imagens

O `PUT /api/me` aceita dois formatos:

**JSON** — informar URL externa:
```json
{
  "photo": "https://exemplo.com/avatar.jpg",
  "banner": "https://exemplo.com/banner.jpg"
}
```

**Multipart** — upload direto de arquivo:
```
PUT /api/me
Content-Type: multipart/form-data

name: "Novo Nome"
bio: "Minha bio"
photo: (arquivo .jpg/.png/.webp, máx 5MB)
banner: (arquivo .jpg/.png/.webp, máx 5MB)
```

## Banco de Dados

- PostgreSQL 16 com extensão `pg_trgm` para busca textual
- Migrations versionadas via Prisma
- Seeds: versão, roles e usuário master

### Modelos principais

- `User` / `UserProfile` — usuários e perfis
- `UserFollow` — seguidores
- `Review` — reviews de jogos
- `Game` / `UserGameList` / `UserGameListItem` — jogos e listas
- `Report` — denúncias de reviews
- `BlockedUser` — usuários bloqueados
- `Notification` — notificações
- `PasswordReset` — tokens de reset de senha

## Previsão de Crescimento e Controle de Performance

### Crescimento esperado por entidade

| Tabela | Crescimento | Estratégia |
|---|---|---|
| `User` | Linear (cadastros) | Indexado por email, username |
| `Review` | Linear por usuário ativo | Indexado por userId + gameId (unique), status |
| `UserFollow` | Linear por usuário ativo | Indexado composto (followerId, followingId) |
| `Notification` | Alto (notificações por ação) | Indexado por toUserId |
| `Report` | Baixo (denúncias) | Indexado por status |

### Índices implementados

```sql
-- Busca textual com pg_trgm (O(log n) para ILIKE)
CREATE INDEX "Game_title_idx" ON "Game" USING gin ("title" gin_trgm_ops);

-- Consultas por status (filtros de moderação/dashboard)
CREATE INDEX "Review_status_idx" ON "Review"("status");
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- Relacionamentos (JOINs frequentes)
CREATE INDEX "Review_userId_idx" ON "Review"("userId");
CREATE INDEX "Review_gameId_idx" ON "Review"("gameId");
CREATE INDEX "BlockedUser_blockedById_idx" ON "BlockedUser"("blockedById");

-- Chaves únicas que evitam duplicatas
UNIQUE("User"."email"), UNIQUE("User"."username")
UNIQUE("Review"."userId", "Review"."gameId")
UNIQUE("UserFollow"."followerId", "UserFollow"."followingId")
```

### Paginação eficiente

Todas as listagens usam **cursor-based pagination** (não OFFSET), que mantém performance constante conforme os dados crescem:

```ts
// Exemplo: feed social com cursor
const { data, nextCursor } = await cursorPaginate({
    findMany: (args) => prisma.review.findMany({ ...args, orderBy: { createdAt: 'desc' } }),
    take: 10,
    cursor,
})
```

### Monitoramento sugerido

```sql
-- Ativar coleta de estatísticas
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 5 queries mais lentas
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 5;

-- Tamanho das tabelas
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### Plano para escala futura

| Volume | Ação |
|---|---|
| **~100k usuários** | Manter índices atuais + conexão pool (PgBouncer) |
| **~1M usuários** | Particionar `Notification` por data (`createdAt`) |
| **~10M reviews** | Particionar `Review` por `gameId` (hash) |
| **Alta concorrência** | Read replicas + cache Redis para feed |

## Gestão de Usuários do Banco de Dados

Atualmente o projeto usa um único usuário (`postgres`) com acesso total. Para produção, recomenda-se separar por função:

### Estrutura sugerida

| Usuário | Permissão | Finalidade |
|---|---|---|
| `app_nexo` | CRUD nas tabelas (SELECT, INSERT, UPDATE, DELETE) | Operação da API |
| `migration_nexo` | DDL (CREATE, ALTER, DROP) + CRUD | Executar migrations |
| `readonly_nexo` | SELECT apenas | Relatórios e dashboards |

### Criação dos usuários

```sql
-- App user (menor privilégio)
CREATE USER app_nexo WITH PASSWORD 'senha_segura';
GRANT CONNECT ON DATABASE "NexoAPI" TO app_nexo;
GRANT USAGE ON SCHEMA public TO app_nexo;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_nexo;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_nexo;

-- Migration user (DDL incluso)
CREATE USER migration_nexo WITH PASSWORD 'senha_segura';
GRANT app_nexo TO migration_nexo;  -- herda permissões do app
GRANT CREATE ON SCHEMA public TO migration_nexo;

-- Read-only user
CREATE USER readonly_nexo WITH PASSWORD 'senha_segura';
GRANT CONNECT ON DATABASE "NexoAPI" TO readonly_nexo;
GRANT USAGE ON SCHEMA public TO readonly_nexo;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_nexo;
```

### Configuração no .env

```env
# App (uso normal da API)
DATABASE_URL=postgresql://app_nexo:senha@localhost:5432/NexoAPI

# Prisma migrations (prisma.config.ts usa env('DATABASE_URL'))
# Durante migrate, trocar para o usuário com DDL:
# DATABASE_URL=postgresql://migration_nexo:senha@localhost:5432/NexoAPI
```

### No Azure Database for PostgreSQL

```bash
# Configurar firewall para permitir IP do App Service
az postgres server firewall-rule create \
  --resource-group nexo-rg \
  --server nexo-pg \
  --name allow-appservice \
  --start-ip-address <ip-do-app-service> \
  --end-ip-address <ip-do-app-service>
```

## Testes

```bash
# Rodar testes
npm test

# Modo watch
npm run test:watch

# Com coverage
npm run test:coverage

# CI (migrations + seeds + testes)
npm run test:ci
```

## CI/CD

O pipeline está em `scripts/azure-pipelines.yml` e executa:

1. Instala dependências
2. Gera Prisma client
3. Roda migrations + seeds + testes
4. Verifica formatação com Biome

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Iniciar em desenvolvimento com hot reload |
| `npm run start:prod` | Migrations + start produção |
| `npm test` | Rodar testes |
| `npm run test:ci` | Migrations + seeds + testes |
| `npm run format` | Formatar código com Biome |
| `npm run sync:seeds` | Popular banco com dados iniciais |
| `npm run generate` | Regenerar Prisma client |
| `npm run migrate` | Criar nova migration |
| `npx prisma studio` | Abrir interface gráfica do banco |

## Postman

Collection disponível em `postman/nexo-api.postman_collection.json` com 45 requests organizadas em 9 pastas. O token JWT é extraído automaticamente via script nos requests de login/register.

## Deploy (Azure)

Sugestão de infraestrutura em nuvem:

| Recurso | Azure |
|---|---|
| API | App Service (Linux, Node 22) |
| Banco | Azure Database for PostgreSQL |
| Storage | Azure Blob Storage (para imagens) |

A pipeline em `scripts/azure-pipelines.yml` pode ser estendida com uma task de deploy para o App Service.
