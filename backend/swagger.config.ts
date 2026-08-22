// src/swagger.ts

import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';

export async function setupSwagger(app: FastifyInstance) {
    await app.register(swagger, {
        transform: ({ schema, url }) => ({
            schema,
            url: url.length > 1 ? url.replace(/\/$/, '') : url,
        }),
        openapi: {
            openapi: '3.1.0',
            info: {
                title: 'Nexo API',
                description: 'API da plataforma social de jogos Nexo',
                version: '2.0.0',
            },
            servers: [{ url: '/', description: 'Servidor atual' }],
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
