export type AuthResponseDTO = {
    tokenType: string;
    token: string;
    refreshToken: string;
    expiresIn: string;
};

export type RefreshResponseDTO = {
    tokenType: string;
    refreshToken: string;
    expiresIn: string;
};
