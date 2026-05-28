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
    subgraph "📱 Mobile App"
        APP["App React Native"]
    end

    subgraph "☁️ Azure App Service"
        API["Backend API<br>Fastify · Porta 443<br>HTTPS / REST"]
        MOD["Módulos<br>Auth · Me · Users · Social<br>Search · Admin · Master<br>Notification · Upload"]
    end

    subgraph "💾 Dados"
        DB[("Azure Database<br>for PostgreSQL 16<br>Prisma ORM")]
        ST["Azure Blob Storage<br>📁 avatars/<br>📁 banners/"]
    end

    APP -->|"HTTPS · REST API"| API
    MOD -->|"conexão banco"| DB
    MOD -->|"upload / download"| ST
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
