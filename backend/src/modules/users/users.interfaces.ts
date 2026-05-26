export type UserPublicProfile = {
    id: number;
    name: string;
    username: string | null;
    bio: string | null;
    photo: string | null;
    banner: string | null;
    followersCount: number;
    followingCount: number;
    createdAt: Date;
    isFollowing?: boolean;
};
