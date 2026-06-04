FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY version.ts ./

COPY swagger.config.ts ./
COPY tsconfig.json ./
COPY certs ./certs
COPY src ./src
COPY docker-entrypoint.sh /app/
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
