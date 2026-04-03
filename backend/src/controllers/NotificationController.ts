import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserTokenPayload } from '../helpers/interfaces/I-Jwt.js';

import prisma from '../helpers/utils/prisma_conn.js';

export class NotificationController 
{
    // =======================================================
    //  @get
    //  @return: { notifications, nextCursor, total }
    //  @status:  200 OK
    // =======================================================
    static async getNotifications(req: FastifyRequest, reply: FastifyReply) 
    {
        try {
            const { cursor } = req.query as { cursor?: string }
            const tokenUser = req.user as UserTokenPayload

            const [notifications, total] = await Promise.all([
                prisma.notification.findMany({
                where: { toUserId: tokenUser.id },
                include: {
                    fromUser: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 6,
                ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
                }),
                prisma.notification.count({ where: { toUserId: tokenUser.id } })
            ])

            const nextCursor = notifications.length === 6 ? notifications[5]?.id ?? null : null
            const data = notifications.slice(0,5)

            return reply.status(200).send({ notifications: data, nextCursor, total })
        } catch (error) {
            throw error
        }
    }

    // =======================================================
    //  @patch
    //  @return: { message: 'Todas notificações marcadas como lidas.' }
    //  @status:  200 OK
    // =======================================================
    static async readAllNotifications(req: FastifyRequest, reply: FastifyReply) 
    {
        try {
            const tokenUser = req.user as UserTokenPayload

            await prisma.notification.updateMany({
                where: { toUserId: tokenUser.id, read: false },
                data: { read: true }
            })

            return reply.status(200).send({ message: 'Todas notificações marcadas como lidas.' })
        } catch (error) {
            throw error
        }
    }

    // =======================================================
    //  @delete
    //  @return: { message: 'Notificação removida.' }
    //  @status:  200 OK
    // =======================================================
    static async deleteNotification(req: FastifyRequest, reply: FastifyReply) 
    {
        try {
            const { id } = req.params as { id: string }
            const tokenUser = req.user as UserTokenPayload

            await prisma.notification.deleteMany({
                where: { id: Number(id), toUserId: tokenUser.id }
            })

            return reply.status(200).send({ message: 'Notificação removida.' })
        } catch (error) {
            throw error
        }
    }

    // =======================================================
    //  @delete
    //  @return: { message: 'Todas notificações removidas.' }
    //  @status:  200 OK
    // =======================================================
    static async deleteAllNotifications(req: FastifyRequest, reply: FastifyReply) 
    {
        try {
            const tokenUser = req.user as UserTokenPayload

            await prisma.notification.deleteMany({
            where: { toUserId: tokenUser.id }
            })

            return reply.status(200).send({ message: 'Todas notificações removidas.' })
        } catch (error) {
            throw error
        }
    }
}