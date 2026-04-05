export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface UserPayload {
    id: number;
    name: string;
    email: string;
    password: string;
    roleId: number;
}

export type FindByEmail = {
    findUnique: (args: { where: { email: string } }) => Promise<unknown>;
};

export type AuthResponse = {
    tokenType: string;
    token: string;
    refreshToken: string;
    expiresIn: string;
};

export type RefreshResponse = {
    tokenType: string;
    refreshToken: string;
    expiresIn: string;
};

export type RefreshParam = {
    refreshToken: string;
};
