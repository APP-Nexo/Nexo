import { translateToPortuguese } from '../shared/integrations/translate/translate.client.js';
import prisma from '../shared/utils/prisma/prisma_conn.js';

async function main() {
    const games = await prisma.game.findMany({
        where: { description: { not: null } },
        select: { id: true, title: true, description: true },
    });

    let translated = 0;
    for (const game of games) {
        const original = game.description!;
        const result = await translateToPortuguese(original);
        if (result !== original) {
            await prisma.game.update({ where: { id: game.id }, data: { description: result } });
            translated += 1;
        }
        console.log(`[${translated}/${games.length}] ${game.title}`);
    }

    console.log(JSON.stringify({ total: games.length, translated }));
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
