import { BaseErrors } from "./base-errors.js";

import prisma from "../utils/prisma_conn.js";

export class AdminErrors extends BaseErrors {
    static async ensureRole(userId: number, roleId: number, message: string) 
    {
        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (user?.roleId === roleId) {
            throw new BaseErrors(message, 400)
        }
    }
}