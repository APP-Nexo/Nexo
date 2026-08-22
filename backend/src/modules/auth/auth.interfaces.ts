export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface UserPayload {
    id: number;
    username: string;
    email: string;
    password: string;
    roleId: number;
}

export interface LoginPayload {
    identifier?: string;
    email?: string;
    password: string;
}

export type AuthResponse = {
    tokenType: string;
    token: string;
    refreshToken: string;
    expiresIn: string;
};

export type RefreshResponse = AuthResponse;

export type RefreshParam = {
    refreshToken: string;
};

export type ForgotPasswordPayload = {
    email: string;
};

export type ResetPasswordPayload = {
    token: string;
    password: string;
};

export type LogoutPayload = {
    allSessions?: boolean;
};

export type SessionMetadata = {
    ipAddress?: string;
    userAgent?: string;
};
