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
  paymentQRs?: { label: string; url: string }[];
  couriers?: string[];
  suspended?: boolean;
  verified?: boolean;
  createdAt: Timestamp;
}

export interface Report {
  id: string;
  type: 'store' | 'item';
  targetId: string;       // store slug or item id
  targetLabel: string;    // display name or item title
  reason: string;
  details?: string;
  reporterContact?: string;
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
