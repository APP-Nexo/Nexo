import type { AppVersion } from "../../src/core/generated/client.js";
import { Logs } from "../../src/core/shared/utils/log/write_logs.js";
import prisma from "../../src/core/shared/utils/prisma/prisma_conn.js";
import { APP_VERSION, DB_VERSION } from "../../version.js";

export async function seedVersion() {
	const existing = await prisma.appVersion.findUnique({
		where: {
			appVersion_dbVersion: {
				appVersion: APP_VERSION,
				dbVersion: DB_VERSION,
			},
		},
	});

	if (existing) {
		await prisma.appVersion.update({
			where: { id: existing.id },
			data: { timestamp: new Date() },
		});

		const { id: _, ...versionData } = existing as any;
		Logs.write(
			{ version: versionData },
			`Version already up to date | app: ${APP_VERSION} | db: ${DB_VERSION}`,
			"info",
			true,
			false,
		);
		return;
	}

	const version = await prisma.appVersion.create({
		data: {
			appVersion: APP_VERSION,
			dbVersion: DB_VERSION,
		},
	});

	const { id: _, ...versionData } = version as any;
	Logs.write(
		{ version: versionData },
		`version created: app ${APP_VERSION} | db ${DB_VERSION}`,
		"info",
		true,
	);
}

if (process.argv[1]?.includes("version")) {
	seedVersion()
		.catch(console.error)
		.finally(() => prisma.$disconnect());
}
