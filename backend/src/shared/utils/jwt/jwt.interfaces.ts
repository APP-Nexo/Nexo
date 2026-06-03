export interface UserTokenPayload {
    id: number;
    email: string;
    password?: string;
    roleId: number;
}
