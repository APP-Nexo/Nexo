# Nexo API

API REST da plataforma social de jogos Nexo. O backend cobre autenticação, catálogo IGDB com cache PostgreSQL, biblioteca pessoal, avaliações, perfis, feed social, notificações e moderação.

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22 + TypeScript |
| HTTP | Fastify 5 |
| Banco | PostgreSQL 16 + Prisma 7 |
| Autenticação | JWT, refresh sessions e Argon2 |
| Catálogo | IGDB/Twitch, com cache no PostgreSQL |
| Testes | Vitest |
| Contrato | OpenAPI e Swagger UI |
| Deploy | Docker multi-stage |

## Domínios

- Autenticação com access token curto, refresh token rotativo e revogação por sessão.
- Recuperação de senha com token aleatório armazenado somente como hash.
- Catálogo, busca, tendências, detalhes e avaliações de jogos.
- Integração IGDB tolerante a indisponibilidade e credenciais opcionais.
- Biblioteca unificada com status, progresso, favoritos e listas personalizadas.
- Reviews publicadas imediatamente, denúncias e moderação posterior.
- Perfil próprio e público, seguidores, feed e notificações tipadas.
- Administração com hierarquia de papéis e log de auditoria.
- Upload seguro de avatar e banner em volume persistente local.

## Requisitos

- Node.js 22 ou superior
- PostgreSQL 16
- Credenciais Twitch/IGDB para sincronizar o catálogo
- SMTP para entregar links de recuperação de senha

## Configuração

Crie `backend/.env` localmente e nunca versione esse arquivo. Para uma execução Docker local, o mínimo é:

```env
POSTGRES_USER=nexo
POSTGRES_PASSWORD=uma-senha-local-forte
POSTGRES_DB=nexo
DATABASE_URL=postgresql://nexo:uma-senha-local-forte@db:5432/nexo?schema=public
SECRET=um-segredo-com-pelo-menos-32-caracteres
```

`MIGRATION_DATABASE_URL`, `APP_DATABASE_URL` e `BACKUP_DATABASE_URL` podem ficar vazias em desenvolvimento; nesse caso o Compose usa a conexão padrão do serviço PostgreSQL. Em produção, prefira URLs separadas e roles com privilégios mínimos.

Variáveis principais:

| Variável | Obrigatória | Descrição |
|---|---:|---|
| `DATABASE_URL` | sim | Conexão PostgreSQL |
| `SECRET` | sim | Segredo JWT com pelo menos 32 caracteres |
| `PORT` | não | Porta HTTP, padrão `3000` |
| `HOST` | não | Host, padrão `0.0.0.0` |
| `CORS_ORIGINS` | produção | Origens separadas por vírgula |
| `TRUST_PROXY` | não | CIDRs ou proxies confiáveis separados por vírgula |
| `TOKEN_EXPIRES` | não | Expiração do access token, padrão `15m` |
| `REFRESH_TOKEN_EXPIRES` | não | Expiração da sessão, padrão `7d` |
| `IGDB_CLIENT_ID` | catálogo | Client ID da aplicação Twitch |
| `IGDB_CLIENT_SECRET` | catálogo | Client secret da aplicação Twitch |
| `IGDB_CACHE_TTL_MINUTES` | não | Validade do cache, padrão `1440` |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | reset | Entrega do link de recuperação |
| `MASTER_EMAIL`, `MASTER_PASSWORD` | não | Cria o primeiro master; senha mínima de 12 caracteres |

Não existem segredos padrão versionados. A aplicação recusa `SECRET` com menos de 32 caracteres.

## Execução Local Sem Docker

Use esta opção somente quando já existir um PostgreSQL acessível pelo host. Configure `DATABASE_URL` para essa conexão antes de executar os comandos. Para usar o PostgreSQL do Compose, prefira a seção de inicialização Docker, porque a porta do banco não é publicada no host por padrão.

```bash
npm install
npm run generate
npm run migrate:deploy
npm run sync:seeds
npm run dev
```

A API fica em `http://localhost:3000`, com Swagger em `http://localhost:3000/docs`.

O processo Node usa HTTP por padrão. Em produção, encerre TLS no ingress ou reverse proxy. TLS direto pode ser habilitado com `TLS_KEY_PATH` e `TLS_CERT_PATH`.

## Docker

O caminho recomendado para desenvolvimento e homologação não exige instalar PostgreSQL no host. O Compose exige `SECRET` e `POSTGRES_PASSWORD` fornecidos pelo ambiente ou por um arquivo `.env` local não versionado. Ele inicia o banco, aplica o baseline, executa migrations/seeds e só então inicia a API.

```bash
cd backend
docker compose up --build -d
docker compose ps
curl http://127.0.0.1:3000/api/verify/health
curl http://127.0.0.1:3000/api/verify/ready
docker compose logs -f api
```

O banco e os uploads usam volumes nomeados. A porta do PostgreSQL não é publicada no host e a API é vinculada a `127.0.0.1` por padrão; defina `API_BIND_ADDRESS=0.0.0.0` somente quando a exposição direta for intencional. Um job `migrate` executa `prisma migrate deploy` e seeds idempotentes; a API inicia somente após esse job concluir e executa apenas o JavaScript compilado.

Em produção, configure `MIGRATION_DATABASE_URL` com o proprietário do schema e `APP_DATABASE_URL` com uma role limitada a DML. O fallback compartilhado existe apenas para facilitar ambientes locais. Ao usar reverse proxy, informe somente seus endereços ou CIDRs em `TRUST_PROXY`.

Para parar os containers preservando banco e uploads:

```bash
docker compose down
```

Para começar novamente com banco vazio, apagando os volumes do projeto:

```bash
docker compose down -v --remove-orphans
docker compose up --build -d
```

Esse reset é destrutivo. O baseline atual é destinado a banco novo e não fornece upgrade automático para instalações existentes.

## Deploy E Atualização

O script `scripts/deploy.sh` executa o fluxo completo sem apagar volumes:

```bash
./scripts/deploy.sh
```

Por padrão ele valida o Compose, recompila as imagens, cria backup, inicia PostgreSQL/migrations/seeds/API e aguarda `/api/verify/ready`. Para atualizar o checkout Git antes do deploy, use somente com a árvore de trabalho limpa:

```bash
./scripts/deploy.sh --pull
```

Para omitir o backup em um ambiente descartável:

```bash
./scripts/deploy.sh --no-backup
```

O script nunca executa `docker compose down -v`. Se o deploy falhar, consulte:

```bash
docker compose ps
docker compose logs --tail=150 migrate api
```

## Banco E Migrations

O diretório `prisma/migrations` contém um baseline completo e reproduzível. Esse baseline substitui o histórico anterior e deve ser aplicado somente a um banco novo ou recriado; ele não é uma migração de upgrade para instalações existentes. Para preservar dados de uma instalação anterior, crie e valide uma migração incremental específica antes do deploy. Não use `prisma db push` em ambientes persistentes.

```bash
npm run migrate:deploy
npm run migrate -- minha_alteracao
```

O baseline inclui constraints para nota de review, progresso da biblioteca, contadores não negativos e prevenção de auto-follow.

## Catálogo IGDB

As leituras usam o PostgreSQL. Em uma busca vazia ou cache expirado, a API tenta atualizar os dados pela IGDB e continua servindo o cache se o provedor estiver indisponível.

Sincronização manual:

```bash
npm run sync:games
```

Em uma imagem compilada:

```bash
npm run sync:games:prod
```

Esse comando pode ser agendado externamente por cron, Kubernetes CronJob ou Azure Container Apps Job.

## Endpoints

### Health

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/verify/health` | Liveness do processo |
| GET | `/api/verify/ready` | Readiness com PostgreSQL |
| GET | `/api/verify/ping` | Ping simples |

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cria usuário e sessão |
| POST | `/api/auth/login` | Login por username ou email |
| POST | `/api/auth/refresh` | Rotaciona refresh token |
| POST | `/api/auth/logout` | Revoga uma ou todas as sessões |
| POST | `/api/auth/forgot-password` | Solicita recuperação |
| POST | `/api/auth/reset-password` | Consome token e redefine senha |

### Perfil E Social

| Método | Rota | Descrição |
|---|---|---|
| GET, PUT, DELETE | `/api/me` | Consulta, atualiza ou exclui a conta |
| PUT | `/api/me/password` | Altera senha e revoga sessões |
| GET | `/api/users/:username` | Perfil público |
| GET | `/api/users/:username/reviews` | Reviews públicas |
| GET | `/api/users/:username/stats` | Estatísticas |
| GET | `/api/users/:username/lists` | Listas públicas |
| GET | `/api/search/users` | Busca pública por username |
| POST, DELETE | `/api/social/:username/follow` | Seguir ou deixar de seguir |
| GET | `/api/social/:username/followers` | Seguidores |
| GET | `/api/social/:username/following` | Seguindo |
| GET | `/api/social/feed` | Feed ou descoberta |

### Jogos

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/games` | Catálogo paginado e filtrável |
| GET | `/api/games/search` | Busca de jogos |
| GET | `/api/search/games` | Alias de busca |
| GET | `/api/games/trending` | Jogos em alta |
| GET | `/api/games/:id` | Detalhe e estado opcional do usuário |
| GET | `/api/games/:id/reviews` | Reviews aprovadas |

### Biblioteca

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/library/games` | Biblioteca do usuário |
| PUT, DELETE | `/api/library/games/:gameId` | Upsert ou remoção |
| GET | `/api/library/favorites` | Favoritos |
| GET, POST | `/api/library/lists` | Lista ou cria coleções |
| PATCH, DELETE | `/api/library/lists/:id` | Atualiza ou remove coleção |
| PUT, DELETE | `/api/library/lists/:id/games/:gameId` | Adiciona ou remove jogo |

### Reviews E Notificações

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/reviews/game/:gameId` | Publica review |
| PATCH, DELETE | `/api/reviews/:id` | Atualiza ou exclui review própria |
| POST | `/api/reviews/:id/reports` | Denuncia review |
| GET | `/api/notification` | Lista notificações |
| PATCH | `/api/notification/:id/read` | Marca uma como lida |
| PATCH | `/api/notification/read-all` | Marca todas como lidas |
| DELETE | `/api/notification/delete/:id` | Remove uma notificação |
| DELETE | `/api/notification/delete-all` | Remove todas |

### Administração

As rotas `/api/admin` exigem admin ou master. As rotas `/api/master` exigem master.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/dashboard` | Métricas |
| GET | `/api/admin/user-all` | Usuários paginados |
| POST, DELETE | `/api/admin/users/:id/block` | Bloqueia ou desbloqueia |
| GET | `/api/admin/reviews` | Fila de moderação |
| PATCH | `/api/admin/reviews/:id/moderation` | Aprova ou rejeita review |
| GET | `/api/admin/reports` | Denúncias |
| PATCH | `/api/admin/reports/:id` | Resolve ou rejeita denúncia |
| PATCH | `/api/master/user/:id/promote` | Promove usuário |
| PATCH | `/api/master/user/:id/demote` | Rebaixa usuário |
| PATCH | `/api/master/user/:id/ban` | Bane usuário |

## Uploads

`PUT /api/me` aceita JSON ou `multipart/form-data` com `username`, `bio`, `photo` e `banner`. A API limita dois arquivos de 5 MB, valida magic bytes JPEG/PNG/WebP, ignora o nome original e remove imagens substituídas.

O Compose persiste `public/` em volume. Para múltiplas réplicas, substitua o armazenamento local por um object storage compartilhado.

## Testes E Qualidade

```bash
npm run format:check
npm run typecheck
npm test
npm run test:coverage
npm run build
```

O CI também cria um PostgreSQL vazio, executa `prisma migrate deploy`, roda seeds, verifica drift e constrói a imagem Docker.

## Postman

Importe `postman/nexo-api.postman_collection.json` no Postman. A collection já usa `http://127.0.0.1:3000/api`, captura tokens automaticamente após register/login/refresh e cobre as rotas atuais de autenticação, jogos, biblioteca, reviews, social, notificações, admin e master.

Execute primeiro `POST /auth/register` ou `POST /auth/login`. Preencha manualmente `adminToken`, `masterToken`, `gameId`, `listId`, `reviewId` e `notificationId` quando for testar recursos que dependem desses registros. Os campos de arquivo do request multipart ficam desabilitados até um arquivo ser selecionado.

## Backup E Restore

No Compose, um container efêmero baseado no PostgreSQL 16 executa as ferramentas sem expor credenciais de manutenção à API:

```bash
docker compose --profile tools run --rm db-tools
docker compose --profile tools run --rm db-tools /scripts/restore.sh /backups/nexo_arquivo.sql.gz
```

Para executar diretamente no host:

```bash
DATABASE_URL="postgresql://..." ./scripts/backup.sh
DATABASE_URL="postgresql://..." ./scripts/restore.sh backups/nexo_arquivo.sql.gz
```

O backup grava primeiro em arquivo temporário, valida o gzip e só então publica o arquivo final e aplica retenção. O restore deve apontar para um banco vazio, valida a entrada e usa transação com `ON_ERROR_STOP`. Para cron no host, execute `BACKUP_ENV_FILE=/caminho/seguro/nexo.env ./scripts/setup-cron.sh`; o arquivo deve fornecer `DATABASE_URL`.
