export type UserPublicDTO = {
    id: number;
    friendlyId: string | null;
    name: string;
    email: string;
    createdAt: Date;
    roleId: number;
    photo: string | null;
    banner: string | null;
    config: unknown;
    bio: string | null;
    followersCount: number | null;
    followingCount: number | null;
};

export type UserPublicSearchResult = {
    id: number;
    friendlyId: string | null;
    name: string;
    email: string;
    photo: string | null;
    createdAt: Date;
    isFollowing: boolean;
};

export type UserPublicSimple = {
    id: number;
    friendlyId: string | null;
    name: string;
    email: string;
    photo: string | null;
    createdAt: Date;
    roleId: number;
};

export type UserWithFollow = UserPublicSimple & { isFollowing: boolean };
