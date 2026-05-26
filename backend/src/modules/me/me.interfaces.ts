export type UpdateMePayload = {
    name?: string;
    username?: string;
    bio?: string;
    photo?: string;
    banner?: string;
};

export type ChangePasswordPayload = {
    currentPassword: string;
    newPassword: string;
};
