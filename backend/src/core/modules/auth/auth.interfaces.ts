export interface RegisterPayload {
    name: string
    email: string
    password: string
    confirmPassword: string
}

export interface UserPayload {
    id: number
    name: string
    email: string
    password: string
    roleId: number
}

export type FindByEmail = {
    findUnique: (args: { where: { email: string } }) => Promise<unknown>
}