export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const BIO_MAX_LENGTH = 500;
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export type UpdateMePayload = {
    username?: string;
    bio?: string;
};

export type ChangePasswordPayload = {
    currentPassword: string;
    newPassword: string;
};

export type DeleteMePayload = {
    password: string;
};
