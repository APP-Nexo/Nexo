import * as argon2 from 'argon2';

export async function comparePassword(password: string, hash: string) {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
}
