import bcrypt from 'bcrypt'

export async function encryptPassword(password: string) 
{
    const salt = await bcrypt.genSalt(12)
    return await bcrypt.hash(password, salt)
}