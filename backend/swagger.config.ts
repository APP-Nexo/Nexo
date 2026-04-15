// src/swagger.ts

import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';

export async function setupSwagger(app: FastifyInstance) {
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'Nexo API',
                description: 'Documentation API',
                version: '1.0.0',
            },
            security: [
                {
                    bearerAuth: [],
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
    });

    await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
    });
}
