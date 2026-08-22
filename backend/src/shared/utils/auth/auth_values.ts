import { createHash } from 'node:crypto';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_.-]*[a-z0-9])?$/;
const RESERVED_USERNAMES = new Set([
    'admin',
    'auth',
    'docs',
    'friendly',
    'master',
    'me',
    'notification',
    'search',
    'social',
    'uploads',
    'verify',
]);

export function normalizeEmail(value: string) {
    return value.normalize('NFKC').trim().toLowerCase();
}

export function normalizeUsername(value: string) {
    return value.normalize('NFKC').trim().toLowerCase();
}

export function isValidUsername(value: string) {
    return (
        value.length >= USERNAME_MIN_LENGTH &&
        value.length <= USERNAME_MAX_LENGTH &&
        USERNAME_PATTERN.test(value) &&
        !RESERVED_USERNAMES.has(value)
    );
}

export function hashOpaqueToken(token: string) {
    return createHash('sha256').update(token, 'utf8').digest('hex');
}
