import { Timestamp } from 'firebase/firestore';

export interface Store {
  slug: string;
  ownerId: string;
  displayName: string;
  bio?: string;
  photoURL?: string;
  contactNumber: string;
  contactMethod: 'WhatsApp' | 'Viber' | 'SMS' | 'Messenger';
  paymentMethods?: string[];
  paymentQR?: string;
  couriers?: string[];
  createdAt: Timestamp;
}

export interface Item {
  id: string;
  storeSlug: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  condition?: string;
  status: 'available' | 'sold';
  createdAt: Timestamp;
}
