import { defineConfig } from 'prisma/config';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL não configurada.');

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: databaseUrl,
    },
    migrations: {
        seed: 'tsx prisma/seeds/index.ts',
    },
});
