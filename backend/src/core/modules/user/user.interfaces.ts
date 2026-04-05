export type UserProfile = {
    friendlyId: string;
    photo: string | null;
    banner: string | null;
    bio: string | null;
    config: unknown;
    followersCount: number;
    followingCount: number;
};

export type UserData = {
    id: number;
    name: string;
    email: string;
    roleId: number;
    isFollowing: boolean;
};

export type UserResponse = {
    user: UserData;
    profile: UserProfile;
};

export type DeleteUserResponse = {
    message: string;
    deletedAt: string;
    email: string;
};

export type SearchUserQuery = {
    find: string;
    cursor?: string;
};
