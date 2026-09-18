import eldenring from '../assets/images/Elden_Ring_capa.jpg';
import type { Game } from '@/types/Game';

export const games: Game[] = [
  {
    id: '1',
    title: 'ELDEN RING II',
    category: 'RPG',
    image: eldenring,
    isNew: true,
    rating: 4.9,
    genres: ['RPG', 'FANTASY', 'OPEN WORLD'],
  },
  {
    id: '2',
    title: 'ELDEN RING II',
    category: 'RPG',
    image: eldenring,
    rating: 4.8,
    genres: ['RPG', 'FANTASY', 'OPEN WORLD'],
  },
  {
    id: '3',
    title: 'ELDEN RING II',
    category: 'RPG',
    image: eldenring,
    rating: 4.7,
    genres: ['RPG', 'FANTASY', 'OPEN WORLD'],
  },
];

export function getGameById(id: string) {
  return games.find((game) => game.id === id);
}
