import { seedMaster } from "../prisma/seeds/master.js";
import { seedRoles } from "../prisma/seeds/roles.js";
import { seedVersion } from "../prisma/seeds/version.js";

export async function bootstrap() {
	await seedRoles();
	await seedMaster();
	await seedVersion();
}
