import { apiFetch } from './api';
import { toQuery } from './games';

export type UserStatsDTO = {
  totalReviews: number;
  averageRating: number | null;
  totalGames: number;
  followersCount: number;
  followingCount: number;
  memberSince: string;
};

export type PublicUserReview = {
  id: number;
  userId: number;
  gameId: number;
  rating: number;
  text: string | null;
  status: 'approved';
  createdAt: string;
  updatedAt: string;
  game: { id: number; title: string; cover: string | null };
};

export type UserPublicProfile = {
  id: number;
  username: string;
  bio: string | null;
  photo: string | null;
  banner: string | null;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  isFollowing: boolean;
};

export type PublicUserList = {
  id: number;
  userId: number;
  name: string;
  isPublic: true;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  items: { id: number; listId: number; gameId: number; addedAt: string; game: { id: number; title: string; cover: string | null } }[];
};

export const usersApi = {
  get(token: string, username: string) {
    return apiFetch<UserPublicProfile>(`/users/${username}`, { token });
  },
  stats(username: string) {
    return apiFetch<UserStatsDTO>(`/users/${username}/stats`);
  },
  reviews(token: string, username: string, cursor?: number) {
    return apiFetch<{ reviews: PublicUserReview[]; nextCursor: number | null }>(
      `/users/${username}/reviews${toQuery({ cursor })}`,
      { token },
    );
  },
  lists(token: string, username: string) {
    return apiFetch<{ lists: PublicUserList[] }>(`/users/${username}/lists`, { token });
  },
};
