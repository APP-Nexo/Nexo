// prisma/seeds/index.ts
import { seedVersion } from './version.js'
import { seedRoles } from './roles.js'
import prisma from '../../src/helpers/utils/prisma_conn.js'

const seeds = [
    seedVersion,
    seedRoles,
]

async function main() 
{
    for (const seed of seeds) {
        await seed()
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())