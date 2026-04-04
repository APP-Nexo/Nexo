import type { FastifyInstance } from "fastify";
import { checkToken } from "../../shared/middlewares/check_token.js";
import { checkUser } from "../../shared/middlewares/check_user.js";
import { UserController } from "./user.controller.js";
import {
	deleteUserSchemaSwagger,
	getUserSchemaSwagger,
	searchUserSchemaSwagger,
} from "./user.swagger.js";

export async function userRoutes(app: FastifyInstance) {
	// app.patch('/update', { ...updateUserSchemaSwagger, preHandler: [checkToken, checkUser] }, UserController.update) develop

	app.get(
		"/search",
		{ ...searchUserSchemaSwagger, preHandler: [checkToken] },
		UserController.searchUser,
	);
	app.get(
		"/:id",
		{ ...getUserSchemaSwagger, preHandler: [checkToken] },
		UserController.getUser,
	);

	app.patch(
		"/delete/:id",
		{ ...deleteUserSchemaSwagger, preHandler: [checkToken, checkUser] },
		UserController.delete,
	);
}
