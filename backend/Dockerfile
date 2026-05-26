FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY swagger.config.ts ./
COPY tsconfig.json ./
COPY certs ./certs
COPY src ./src

EXPOSE 3000
CMD ["npx", "tsx", "src/server.ts"]
