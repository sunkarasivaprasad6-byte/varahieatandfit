export interface Offer {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  code: string;
  buttonText: string;
  image: string;
  active: boolean;
  createdAt?: number;
}
