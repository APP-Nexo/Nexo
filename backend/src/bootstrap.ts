import { GenericQueries } from './repository/generics.js'
import prisma from './helpers/utils/prisma_conn.js'
import type { AppVersion } from './generated/client.js'
import { APP_VERSION, DB_VERSION } from '../version.js'
import { seedVersion } from '../prisma/seeds/version.js'
import { seedRoles } from '../prisma/seeds/roles.js'

const versionQuery = new GenericQueries<AppVersion>(prisma.appVersion)

export async function bootstrap() {
    await seedVersion()

    let version = await versionQuery.findLatest()

    if (!version) {
        version = await versionQuery.create({
            appVersion: APP_VERSION,
            dbVersion: DB_VERSION,
        })
    }

    await seedRoles()

    return { version }
}