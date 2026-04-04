export interface UserTokenPayload {
    id: number;
    name: string;
    email: string;
    password?: string;
    roleId: number;
}
