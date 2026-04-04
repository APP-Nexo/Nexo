// prisma/seeds/index.ts

import prisma from "../../src/core/shared/utils/prisma/prisma_conn.js";
import { seedMaster } from "./master.js";
import { seedRoles } from "./roles.js";
import { seedVersion } from "./version.js";

const seeds = [seedVersion, seedRoles, seedMaster];

async function main() {
	for (const seed of seeds) {
		await seed();
	}
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
