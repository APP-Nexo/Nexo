export const registerSchemaSwagger = 
{
    schema: {
        tags: ['Auth'],
        summary: 'Register',
        body: {
        type: 'object',
        required: ['name', 'email', 'password', 'confirmPassword'],
        properties: {
            name:            { type: 'string' },
            email:           { type: 'string' },
            password:        { type: 'string' },
            confirmPassword: { type: 'string' }
        }
        },
        response: {
            201: {
                type: 'object',
                properties: {
                    token: { type: 'string' }
                }
            }
        }
    }
}

export const loginSchemaSwagger = 
{
    schema: {
        tags: ['Auth'],
        summary: 'Login',
        body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email:    { type: 'string' },
            password: { type: 'string' }
        }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                token: { type: 'string' }
                }
            }
        }
    }
}