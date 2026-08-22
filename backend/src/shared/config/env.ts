import 'dotenv/config';

const rawNodeEnv = process.env.NODE_ENV ?? 'development';
if (!['development', 'test', 'production'].includes(rawNodeEnv)) {
    throw new Error('NODE_ENV deve ser development, test ou production.');
}
const nodeEnv = rawNodeEnv as 'development' | 'test' | 'production';
const testSecret = 'nexo-test-secret-with-at-least-32-characters';
const secret = process.env.SECRET ?? (nodeEnv === 'test' ? testSecret : '');

if (secret.length < 32) {
    throw new Error('SECRET deve ter pelo menos 32 caracteres.');
}

function positiveInteger(value: string | undefined, fallback: number, name: string) {
    const parsed = Number(value ?? fallback);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${name} deve ser um número inteiro positivo.`);
    }
    return parsed;
}

function commaSeparated(value: string | undefined) {
    return value
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

export const env = {
    nodeEnv,
    isTest: nodeEnv === 'test',
    isProduction: nodeEnv === 'production',
    port: positiveInteger(process.env.PORT, 3000, 'PORT'),
    host: process.env.HOST ?? '0.0.0.0',
    databaseUrl: process.env.DATABASE_URL,
    secret,
    tokenType: process.env.TOKEN_TYPE ?? 'Bearer',
    tokenExpires: process.env.TOKEN_EXPIRES ?? '15m',
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES ?? '7d',
    jwtIssuer: process.env.JWT_ISSUER?.trim() || 'nexo-api',
    jwtAudience: process.env.JWT_AUDIENCE?.trim() || 'nexo-app',
    corsOrigins: commaSeparated(process.env.CORS_ORIGINS) ?? [],
    trustProxy: commaSeparated(process.env.TRUST_PROXY) ?? [],
    tlsKeyPath: process.env.TLS_KEY_PATH,
    tlsCertPath: process.env.TLS_CERT_PATH,
    igdbClientId: process.env.IGDB_CLIENT_ID,
    igdbClientSecret: process.env.IGDB_CLIENT_SECRET,
    igdbCacheTtlMinutes: positiveInteger(
        process.env.IGDB_CACHE_TTL_MINUTES,
        1440,
        'IGDB_CACHE_TTL_MINUTES',
    ),
} as const;

export function assertRuntimeEnv() {
    if (!env.databaseUrl) throw new Error('DATABASE_URL não configurada.');

    if (Boolean(env.tlsKeyPath) !== Boolean(env.tlsCertPath)) {
        throw new Error('TLS_KEY_PATH e TLS_CERT_PATH devem ser configurados em conjunto.');
    }
    if (Boolean(env.igdbClientId) !== Boolean(env.igdbClientSecret)) {
        throw new Error('IGDB_CLIENT_ID e IGDB_CLIENT_SECRET devem ser configurados em conjunto.');
    }

    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const smtpValues = [smtpHost, smtpUser, smtpPass];
    if (smtpValues.some(Boolean) && !smtpValues.every(Boolean)) {
        throw new Error('SMTP_HOST, SMTP_USER e SMTP_PASS devem ser configurados em conjunto.');
    }
    if (smtpValues.every(Boolean)) {
        positiveInteger(process.env.SMTP_PORT, 587, 'SMTP_PORT');
        const appUrl = process.env.APP_URL?.trim();
        if (!appUrl) throw new Error('APP_URL é obrigatória quando SMTP está configurado.');

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(appUrl);
        } catch {
            throw new Error('APP_URL deve ser uma URL absoluta válida.');
        }
        if (env.isProduction && parsedUrl.protocol !== 'https:') {
            throw new Error('APP_URL deve usar HTTPS em produção quando SMTP está configurado.');
        }
    }
}
