export type UpdateMePayload = {
    username?: string;
    bio?: string;
};

export type ChangePasswordPayload = {
    currentPassword: string;
    newPassword: string;
};
