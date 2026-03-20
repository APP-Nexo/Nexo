import '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { TokenErrors } from '../errors/token-erros.js'

import { app } from '../../conf.js'

import type { UserTokenPayload } from '../interfaces/I-Jwt.js'

export class JwtToken 
{
    static async create(user: UserTokenPayload, reply: FastifyReply)
    {
        try
        {
            const token = app.jwt.sign(
                {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    access: user.access,
                },
                { expiresIn: '7d' }
            )

            return token
        } catch(e) {
            TokenErrors.throwCreationFailed()
        }
    }

    static async get(req: FastifyRequest)
    {
        try
        {
            const token = req.headers.authorization?.replace('Bearer ', '')

            if(!token) TokenErrors.throwMissing()
                
            return token
        } catch(e) {
            TokenErrors.throwInvalid()
        }
    }

    static async getByUser(req: FastifyRequest)
    {
        try {
            await req.jwtVerify()

            const user = req.user as UserTokenPayload

            return user
        } catch (e) {
            TokenErrors.throwInvalid()
        }
    }
}