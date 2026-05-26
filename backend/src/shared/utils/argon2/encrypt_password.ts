import * as argon2 from 'argon2';

export async function encryptPassword(password: string) {
    return await argon2.hash(password);
}
