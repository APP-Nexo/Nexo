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
    access: string
}