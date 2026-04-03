import { BaseErrors } from "./base-errors.js";

export class notificationErrors extends BaseErrors
{
    static async ensureNotificationExists(table: any, id: number, toUserId: number) 
    {
        const exists = await table.findFirst({
            where: { id, toUserId }
        })

        if (!exists) throw new BaseErrors('Notificação não existe.', 404)
    }

    static async ensureHasNotifications(table: any, toUserId: number) 
    {
        const count = await table.count({ where: { toUserId } })
        if (count === 0) throw new BaseErrors('Você não possui notificações.', 404)
    }

    static async ensureHasUnreadNotifications(table: any, toUserId: number) {
        const count = await table.count({ where: { toUserId, read: false } })
        if (count === 0) throw new BaseErrors('Você não possui notificações não lidas.', 404)
    }
}