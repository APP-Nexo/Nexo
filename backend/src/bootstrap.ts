// src/bootstrap.ts
import { GenericQueries } from './repository/generics.js'
import prisma from './helpers/utils/prisma_conn.js'
import type { AppVersion } from './generated/client.js'
import { APP_VERSION, DB_VERSION } from '../version.js'

const versionQuery = new GenericQueries<AppVersion>(prisma.appVersion)

export async function bootstrap() 
{
    let version = await versionQuery.findLatest()

    if (!version) 
    {
        version = await versionQuery.create({
        appVersion: APP_VERSION,
        dbVersion: DB_VERSION,
        })
    }

    return { version }
}