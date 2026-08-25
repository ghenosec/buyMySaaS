export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  _count?: { saas: number };
};
export type Review = {
  id: string;
  rating: number;
  comment: string;
  spam?: boolean;
  spamTerms?: string[];
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationReason?: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl?: string | null };
};
export type Saas = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  tagline: string;
  shortDescription: string;
  description: string;
  logoUrl?: string | null;
  accentColor?: string | null;
  countryCode: string;
  language: string;
  websiteUrl: string;
  trialUrl?: string | null;
  checkoutUrl?: string | null;
  docsUrl?: string | null;
  demoUrl?: string | null;
  pricingType:
    'FREE' | 'FREEMIUM' | 'SUBSCRIPTION' | 'ONE_TIME' | 'LIFETIME' | 'CUSTOM';
  priceCents?: number | null;
  currency: string;
  billingInterval?: 'MONTH' | 'YEAR' | 'ONE_TIME' | null;
  pricingLabel?: string | null;
  isBrazilian: boolean;
  isAdult: boolean;
  tags: string[];
  technologies: string[];
  status:
    | 'DRAFT'
    | 'PENDING_PAYMENT'
    | 'PENDING_REVIEW'
    | 'PUBLISHED'
    | 'REJECTED'
    | 'ARCHIVED';
  rejectionReason?: string | null;
  publishedAt?: string | null;
  sponsoredUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  averageRating?: number;
  score?: number;
  isSponsored?: boolean;
  requiresReapproval?: boolean;
  owner?: { id: string; name: string; avatarUrl?: string | null };
  categories?: { category: Category }[];
  screenshots?: { id: string; url: string; alt: string; position: number }[];
  reviews?: Review[];
  _count?: {
    favorites: number;
    boosts?: number;
    analyticsEvents: number;
    reviews: number;
  };
};
export type Paginated<T> = {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string | null;
};
