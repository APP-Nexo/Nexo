export type UpdateMePayload = {
    username?: string;
    bio?: string;
    photo?: string;
    banner?: string;
};

export type ChangePasswordPayload = {
    currentPassword: string;
    newPassword: string;
};
