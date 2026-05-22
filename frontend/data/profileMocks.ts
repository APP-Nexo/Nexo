import type { ImageSourcePropType } from 'react-native';
import eldenring from '../assets/images/Elden_Ring_capa.jpg';

export type UserProfile = {
  username: string;
  name: string;
  bio: string;
  initials: string;
  level: string;
  status: 'ONLINE' | 'OFFLINE' | 'PLAYING';
  stats: {
    games: number;
    reviews: number;
    following: number;
    followers: number;
  };
};

export type FavoriteGame = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  rating: number;
};

export type RatingEntry = {
  id: string;
  title: string;
  rating: number;
};

export type ActivityEntry = {
  id: string;
  gameTitle: string;
  actionType: 'review' | 'rating' | 'favorite';
  actionLabel: string;
  date: string;
  rating: number;
  image: ImageSourcePropType;
};

export type LogEntry = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  rating: number;
};

export type GameList = {
  id: string;
  title: string;
  count: number;
};

export const MOCK_USER: UserProfile = {
  username: 'kaizo_br',
  name: 'Guilherme',
  bio: 'Gamer desde criança. Soulslike é meu estilo de vida.\nNunca dropei um FromSoft.',
  initials: 'KZ',
  level: 'LEVEL 42',
  status: 'ONLINE',
  stats: {
    games: 147,
    reviews: 89,
    following: 312,
    followers: 204,
  },
};

export const MOCK_FAVORITES: FavoriteGame[] = [
  { id: '1', title: 'ELDEN RING', image: eldenring, rating: 5.0 },
  { id: '2', title: 'HOLLOW KNIGHT', image: eldenring, rating: 4.8 },
  { id: '3', title: 'HADES', image: eldenring, rating: 4.5 },
  { id: '4', title: 'PERSONA 5 ROYAL', image: eldenring, rating: 4.7 },
];

export const MOCK_RATINGS: RatingEntry[] = [
  { id: '1', title: 'Elden Ring', rating: 5.0 },
  { id: '2', title: 'Hollow Knight', rating: 4.8 },
  { id: '3', title: 'Persona 5 Royal', rating: 4.7 },
  { id: '4', title: 'Hades', rating: 4.5 },
  { id: '5', title: 'Cyberpunk 2077', rating: 4.0 },
];

export const MOCK_ACTIVITIES: ActivityEntry[] = [
  {
    id: '1',
    gameTitle: 'ELDEN RING',
    actionType: 'review',
    actionLabel: 'review publicada',
    date: '2 dias atrás',
    rating: 5,
    image: eldenring,
  },
  {
    id: '2',
    gameTitle: 'HADES',
    actionType: 'rating',
    actionLabel: 'nota atualizada',
    date: '4 dias atrás',
    rating: 4,
    image: eldenring,
  },
  {
    id: '3',
    gameTitle: 'CYBERPUNK 2077',
    actionType: 'favorite',
    actionLabel: 'adicionado aos favoritos',
    date: '1 semana atrás',
    rating: 3,
    image: eldenring,
  },
];

export const MOCK_LOG: LogEntry[] = [
  { id: '1', title: 'ELDEN RING', image: eldenring, rating: 5.0 },
  { id: '2', title: 'HOLLOW KNIGHT', image: eldenring, rating: 4.8 },
  { id: '3', title: 'HADES', image: eldenring, rating: 4.5 },
  { id: '4', title: 'THE LAST OF US', image: eldenring, rating: 4.6 },
  { id: '5', title: 'CYBERPUNK 2077', image: eldenring, rating: 4.0 },
  { id: '6', title: 'POKÉMON', image: eldenring, rating: 4.2 },
];

export const MOCK_LISTS: GameList[] = [
  { id: '1', title: 'Melhores Soulslike', count: 8 },
  { id: '2', title: 'Top RPGs 2025', count: 12 },
  { id: '3', title: 'Favoritos da vida', count: 15 },
];
