export interface VenueMedia {
  url: string;
  alt: string;
}

export interface VenueMeta {
  wifi: boolean;
  parking: boolean;
  breakfast: boolean;
  pets: boolean;
}

export interface VenueLocation {
  address: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  continent: string | null;
  lat: number;
  lng: number;
}

export interface VenueOwner {
  name: string;
  email: string;
  bio: string | null;
  avatar: VenueMedia | null;
  banner: VenueMedia | null;
}

export interface VenueBooking {
  id: string;
  dateFrom: string;
  dateTo: string;
  guests: number;
  created: string;
  updated: string;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  media: VenueMedia[];
  price: number;
  maxGuests: number;
  rating: number;
  created: string;
  updated: string;
  meta: VenueMeta;
  location: VenueLocation;
  /** Only present when fetched with _owner=true */
  owner?: VenueOwner;
  /** Only present when fetched with _bookings=true */
  bookings?: VenueBooking[];
}

export interface NoroffMeta {
  isFirstPage: boolean;
  isLastPage: boolean;
  currentPage: number;
  previousPage: number | null;
  nextPage: number | null;
  pageCount: number;
  totalCount: number;
}

export interface VenuesResponse {
  data: Venue[];
  meta: NoroffMeta;
}

export interface VenueResponse {
  data: Venue;
  meta: Record<string, never>;
}
