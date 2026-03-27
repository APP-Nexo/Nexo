// src/swagger.ts
import type { FastifyInstance } from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

export async function setupSwagger(app: FastifyInstance) 
{
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'Nexo API',
                description: 'Documentação da API',
                version: '1.0.0'
            },
            components: {
                securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
                }
            }
        }
    })

    await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true
        }
    })
}