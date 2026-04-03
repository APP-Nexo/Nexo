import { seedVersion } from '../../prisma/seeds/version.js'
import { seedRoles } from '../../prisma/seeds/roles.js'
import { seedMaster } from '../../prisma/seeds/master.js'

export async function bootstrap() {
    await seedRoles()
    await seedMaster()
    await seedVersion()
}