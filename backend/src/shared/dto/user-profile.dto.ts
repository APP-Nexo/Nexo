export type UserProfileDTO = {
    friendlyId: string;
    photo: string | null;
    banner: string | null;
    bio: string | null;
    config: unknown;
    followersCount: number;
    followingCount: number;
};
