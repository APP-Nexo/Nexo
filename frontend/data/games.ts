import eldenring from '../assets/images/Elden_Ring_capa.jpg';
import persona5 from '../assets/images/persona 5.jpg';
import hadesII from '../assets/images/hades-II.jpg';
import hollowKnightSilkSong from '../assets/images/hollow-knight-silk-song.jpg';
import residentEvilRequiem from '../assets/images/resident-evil-requiem.jpg';
import theLastOfUs2 from '../assets/images/the-last-of-us-2.jpg';
import type { Game } from '@/types/Game';

export const games: Game[] = [
  {
    id: '1',
    title: 'ELDEN RING',
    category: 'RPG',
    image: eldenring,
    isNew: true,
    rating: 4.9,
    genres: ['RPG', 'FANTASY', 'OPEN WORLD'],
  },
  {
    id: '2',
    title: 'PERSONA 5',
    category: 'RPG',
    image: persona5,
    rating: 4.8,
    genres: ['JRPG', 'AVENTURA'],
  },
  {
    id: '3',
    title: 'HADES II',
    category: 'ACTION',
    image: hadesII,
    rating: 4.6,
    genres: ['METROIDVANIA', 'ROGUELIKE'],
  },
  {
    id: '4',
    title: 'HOLLOW KNIGHT SILK SONG',
    category: 'ACTION',
    image: hollowKnightSilkSong,
    rating: 4.7,
    genres: ['METROIDVANIA', 'PLATAFORMER'],
  },
  {
    id: '5',
    title: 'RESIDENT EVIL REQUIEM',
    category: 'HORROR',
    image: residentEvilRequiem,
    rating: 4.3,
    genres: ['HORROR', 'SURVIVAL'],
  },
  {
    id: '6',
    title: 'THE LAST OF US 2',
    category: 'ACTION',
    image: theLastOfUs2,
    rating: 4.8,
    genres: ['AVENTURA', 'AÇÃO'],
  },
];

export function getGameById(id: string) {
  return games.find((game) => game.id === id);
}
