import type { ImageSourcePropType } from 'react-native';

export type Game = {
  id: string;
  title: string;
  category: string;
  image: string | ImageSourcePropType;
  isNew?: boolean;
};