import { apiGet, apiPut } from "./client";

export interface ProfileMedia {
  url: string;
  alt: string;
}

export interface ProfileVenueSummary {
  id: string;
  name: string;
  media: ProfileMedia[];
  location: {
    city: string | null;
    country: string | null;
  };
}

export interface ProfileBooking {
  id: string;
  dateFrom: string;
  dateTo: string;
  guests: number;
  venue?: ProfileVenueSummary;
}

export interface CustomerBookingsResponse {
  data: ProfileBooking[];
  meta: {
    isFirstPage: boolean;
    isLastPage: boolean;
    currentPage: number;
    previousPage: number | null;
    nextPage: number | null;
    pageCount: number;
    totalCount: number;
  };
}

export interface ManagedVenueBooking {
  id: string;
  dateFrom: string;
  dateTo: string;
  guests: number;
  customer?: {
    name: string;
    email?: string;
  };
}

export interface ManagedVenue {
  id: string;
  name: string;
  description: string;
  media: ProfileMedia[];
  price: number;
  maxGuests: number;
  location: {
    city: string | null;
    country: string | null;
  };
  bookings?: ManagedVenueBooking[];
}

export interface ManagedVenuesResponse {
  data: ManagedVenue[];
  meta: {
    isFirstPage: boolean;
    isLastPage: boolean;
    currentPage: number;
    previousPage: number | null;
    nextPage: number | null;
    pageCount: number;
    totalCount: number;
  };
}

export interface Profile {
  name: string;
  email: string;
  bio: string | null;
  avatar: ProfileMedia | null;
  banner: ProfileMedia | null;
  venueManager: boolean;
  bookings?: ProfileBooking[];
}

export interface ProfileResponse {
  data: Profile;
  meta: Record<string, never>;
}

export interface UpdateProfilePayload {
  avatar?: ProfileMedia;
}

export function getProfile(name: string): Promise<ProfileResponse> {
  return apiGet<ProfileResponse>(`/holidaze/profiles/${name}`, {
    params: { _bookings: true },
  });
}

export function updateProfile(
  name: string,
  payload: UpdateProfilePayload,
): Promise<ProfileResponse> {
  return apiPut<ProfileResponse>(`/holidaze/profiles/${name}`, payload);
}

export function getManagedVenues(name: string): Promise<ManagedVenuesResponse> {
  return apiGet<ManagedVenuesResponse>(`/holidaze/profiles/${name}/venues`, {
    params: { _bookings: true, _customer: true },
  });
}

export function getCustomerBookings(
  name: string,
): Promise<CustomerBookingsResponse> {
  return apiGet<CustomerBookingsResponse>(
    `/holidaze/profiles/${name}/bookings`,
    {
      params: { _venue: true },
    },
  );
}
