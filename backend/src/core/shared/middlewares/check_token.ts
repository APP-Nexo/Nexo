import type { FastifyRequest } from "fastify";
import { JwtToken } from "../utils/jwt/jwt_token.js";

import { TokenErrors } from "../utils/jwt/token.errors.js";

export async function checkToken(req: FastifyRequest) {
	if (!req.headers.authorization) TokenErrors.throwMissing();
	await JwtToken.getByUser(req);
	await JwtToken.get(req);
}
