export type ForgotPasswordDTO = {
    email: string;
};

export type ResetPasswordDTO = {
    token: string;
    password: string;
};
