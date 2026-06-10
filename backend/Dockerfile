FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache openssl postgresql-client

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY version.ts ./

COPY swagger.config.ts ./
COPY tsconfig.json ./
COPY scripts ./scripts
COPY certs ./certs
COPY src ./src

ENTRYPOINT []
EXPOSE 3000
CMD npx prisma generate && npx prisma db push --accept-data-loss && npx tsx prisma/seeds/index.ts && npx tsx src/server.ts
