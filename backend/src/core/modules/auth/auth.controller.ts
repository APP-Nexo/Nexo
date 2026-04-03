import type { FastifyRequest, FastifyReply } from 'fastify';
import type { LoginPayload, RegisterPayload } from './auth.interfaces.js';
import { AuthService } from './auth.service.js';

export class AuthController {
    // =================================================================================================
    //  @post
    //  @return: { tokenType: process.env.TOKEN_TYPE!, token, expiresIn: process.env.TOKEN_EXPIRES! }
    //  @status:  201
    // =================================================================================================
    static async register(req: FastifyRequest, reply: FastifyReply) 
    {
        try {
            const response = await AuthService.register(req.body as RegisterPayload, reply)
            return reply.status(201).send(response)
        } catch(error) {
            throw error;
        }
    }

    // =================================================================================================
    //  @post
    //  @return: { tokenType: process.env.TOKEN_TYPE!, token, expiresIn: process.env.TOKEN_EXPIRES! }
    //  @status:  200 OK
    // =================================================================================================
    static async login(req: FastifyRequest, reply: FastifyReply) 
    {
        try {
            const { email, password } = req.body as LoginPayload

            const response = await AuthService.login(email!, password, reply)
            return reply.status(200).send(response)
        } catch(error) {
            throw error
        }
    }
}