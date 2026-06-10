import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: process.env.DATABASE_URL || 'postgresql://nexo:nexo@db:5432/nexo?schema=public',
    },
    migrations: {
        seed: 'tsx prisma/seeds/index.ts',
    },
});
