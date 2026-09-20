import { apiFetch } from './api';
import { toQuery } from './games';
import type { UserGameStatus } from './library';

export type FeedItem = {
  id: number;
  type: 'review';
  userId: number;
  userUsername: string;
  userPhoto: string | null;
  createdAt: string;
  review: {
    id: number;
    gameId: number;
    gameTitle: string;
    gameCover: string | null;
    rating: number;
    text: string | null;
    progressStatus: UserGameStatus | null;
  };
};

export type SocialUser = { id: number; username: string; photo: string | null; isFollowing: boolean };

export const socialApi = {
  feed(token: string, cursor?: number) {
    return apiFetch<{ feed: FeedItem[]; nextCursor: number | null }>(
      `/social/feed${toQuery({ cursor })}`,
      { token },
    );
  },
  follow(token: string, username: string) {
    return apiFetch<{ message: string }>(`/social/${username}/follow`, { method: 'POST', token });
  },
  unfollow(token: string, username: string) {
    return apiFetch<{ message: string }>(`/social/${username}/follow`, {
      method: 'DELETE',
      token,
    });
  },
  removeFollower(token: string, username: string) {
    return apiFetch<{ message: string }>(`/social/${username}/followers`, {
      method: 'DELETE',
      token,
    });
  },
  followers(token: string, username: string, cursor?: number) {
    return apiFetch<{ followers: SocialUser[]; nextCursor: number | null }>(
      `/social/${username}/followers${toQuery({ cursor })}`,
      { token },
    );
  },
  following(token: string, username: string, cursor?: number) {
    return apiFetch<{ following: SocialUser[]; nextCursor: number | null }>(
      `/social/${username}/following${toQuery({ cursor })}`,
      { token },
    );
  },
};
