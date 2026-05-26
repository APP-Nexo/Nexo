import type { UserProfileDTO } from './user-profile.dto.js';
import type { UserPublicDTO } from './user-public.dto.js';

export type UserResponseDTO = {
    user: Omit<
        UserPublicDTO,
        'photo' | 'banner' | 'bio' | 'config' | 'friendlyId' | 'followersCount' | 'followingCount'
    > & { isFollowing: boolean };
    profile: UserProfileDTO;
};

export type DeleteUserResponseDTO = {
    message: string;
    deletedAt: string;
    email: string;
};
