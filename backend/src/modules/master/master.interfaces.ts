export type RoleActionResponse = {
    message: string;
    email: string | undefined;
    role: string;
};

export type BanResponse = {
    message: string;
    email: string | undefined;
    bannedAt: string;
};
