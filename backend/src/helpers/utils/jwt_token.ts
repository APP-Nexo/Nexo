import '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { app } from '../../conf.js'

import type { UserTokenPayload } from '../interfaces/I-Jwt.js'
import { use } from 'react'

export class JwtToken 
{
    static async create(user: UserTokenPayload, reply: FastifyReply)
    {
        try
        {
            const token = app.jwt.sign(
                {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    acesso: user.acesso,
                },
                { expiresIn: '7d' }
            )

            return token
        } catch(e) {
            reply.status(500).send({ status: 500, message: 'Falha ao criar token.' })
        }
    }

    static async get(req: FastifyRequest, reply: FastifyReply)
    {
        try
        {
            const token = req.headers.authorization?.replace('Barer', '')

            if(!token) return reply.status(401).send({ message: 'Token não informado.' })
                
            return token
        } catch(e) {
            reply.status(500).send({ status: 500, message: 'Falha ao obter token.' })
        }
    }

    static async getByUser(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            await req.jwtVerify()

            const user = req.user as UserTokenPayload

            return user
        } catch (e) {
            reply.status(401).send({ message: 'Token inválido ou expirado.' })
        }
    }
}