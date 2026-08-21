export interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

export const menuItems: MenuItem[] = [
  {
    id: 1,
    name: "Paneer Biryani",
    price: 299,
    image: "/menu/paneer-biryani.jpg",
    category: "Biryani",
    description: "Authentic Dum Paneer Biryani",
  },
  {
    id: 2,
    name: "Chicken Biryani",
    price: 349,
    image: "/menu/chicken-biryani.jpg",
    category: "Biryani",
    description: "Hyderabadi Chicken Biryani",
  },
  {
    id: 3,
    name: "Veg Fried Rice",
    price: 199,
    image: "/menu/fried-rice.jpg",
    category: "Rice",
    description: "Fresh Veg Fried Rice",
  },
  {
    id: 4,
    name: "Butter Naan",
    price: 45,
    image: "/menu/naan.jpg",
    category: "Bread",
    description: "Soft Butter Naan",
  },
  {
    id: 5,
    name: "Paneer Butter Masala",
    price: 249,
    image: "/menu/paneer-butter.jpg",
    category: "Curry",
    description: "Creamy Paneer Butter Masala",
  },
];