// prisma/seeds/index.ts
import { seedVersion } from './version.js'
import { seedRoles } from './roles.js'
import { seedMaster } from './master.js'
import prisma from '../../src/helpers/utils/prisma_conn.js'

const seeds = [
    seedVersion,
    seedRoles,
    seedMaster
]

async function main() 
{
    for (const seed of seeds) {
        await seed()
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())