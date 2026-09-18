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

export const usersApi = {
  stats(username: string) {
    return apiFetch<UserStatsDTO>(`/users/${username}/stats`);
  },
  reviews(token: string, username: string, cursor?: number) {
    return apiFetch<{ reviews: PublicUserReview[]; nextCursor: number | null }>(
      `/users/${username}/reviews${toQuery({ cursor })}`,
      { token },
    );
  },
};
