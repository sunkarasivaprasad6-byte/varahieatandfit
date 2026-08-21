export interface MenuItem {
  id?: string;

  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  rating: number;
  calories: number;
  protein: string;
  isVegetarian: boolean;
}