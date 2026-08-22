export interface UserTokenPayload {
    sub: string;
    id: number;
    email: string;
    roleId: number;
    typ: 'access';
    sid: string;
    jti: string;
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string | string[];
}

export interface RefreshTokenPayload {
    sub: string;
    id: number;
    typ: 'refresh';
    sid: string;
    jti: string;
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string | string[];
}

export type TokenUser = Pick<UserTokenPayload, 'id' | 'email' | 'roleId'>;
