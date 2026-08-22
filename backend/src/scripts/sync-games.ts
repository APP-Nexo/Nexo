import { syncGamesCatalog } from '../modules/games/games.service.js';
import prisma from '../shared/utils/prisma/prisma_conn.js';

async function main() {
    const result = await syncGamesCatalog({ limit: 50 });
    if (!result.configured) {
        throw new Error('IGDB_CLIENT_ID e IGDB_CLIENT_SECRET não configurados.');
    }
    console.log(JSON.stringify(result));
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
