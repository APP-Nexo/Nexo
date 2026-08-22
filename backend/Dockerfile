FROM node:22-alpine AS build

WORKDIR /app
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json version.ts swagger.config.ts ./
COPY src ./src
RUN npx prisma generate && npm run build

FROM build AS migration

ENV NODE_ENV=production
USER node
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seeds/index.js"]

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts version.ts swagger.config.ts ./
COPY --chown=node:node public ./public
COPY --chown=node:node --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["npm", "start"]
