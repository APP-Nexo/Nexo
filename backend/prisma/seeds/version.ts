import { APP_VERSION, DB_VERSION } from "../../version.js";
import { Logs } from "../../src/helpers/utils/write_logs.js";

import type { AppVersion } from '../../src/generated/client.js'

import { GenericQueries } from "../../src/repository/generics.js";
import prisma from "../../src/helpers/utils/prisma_conn.js";
const versionQuery = new GenericQueries<AppVersion>(prisma.appVersion)

export async function seedVersion() {
    const existing = await versionQuery.findUnique({ 
        appVersion_dbVersion: {
        appVersion: APP_VERSION,
        dbVersion: DB_VERSION
        }
    })

    if (existing) {
        await versionQuery.update(existing.id, { timestamp: new Date() })
        const { id: _, ...versionData } = existing as any
        Logs.write({ version: versionData }, `Version already up to date | app: ${APP_VERSION} | db: ${DB_VERSION}`, 'info', true, false)
        return
    }

    const version = await versionQuery.create({
        appVersion: APP_VERSION,
        dbVersion: DB_VERSION,
    })

    const { id: _, ...versionData } = version as any
    Logs.write({ version: versionData }, `version: app ${APP_VERSION} | db ${DB_VERSION}`, 'info', true)
}

if (process.argv[1]?.includes('version')) 
{
    seedVersion().catch(console.error).finally(() => prisma.$disconnect())
}