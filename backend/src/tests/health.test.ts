import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../conf.js";
import { closeApp, startApp } from "./tests.setup.js";

// ============================================================
//  TESTS
// ============================================================
beforeAll(async () => await startApp());
afterAll(async () => await closeApp());

describe("Health - health", () => {
	it("should return healthy status", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/verify/health",
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body).toHaveProperty("message", "healthy");
		expect(body).toHaveProperty("uptime");
	});
});

describe("Health - ping", () => {
	it("should return pong", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/verify/ping",
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body).toHaveProperty("message", "pong");
		expect(body).toHaveProperty("timestamp");
	});
});
