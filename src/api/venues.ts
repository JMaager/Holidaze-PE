import { apiDelete, apiGet, apiPost, apiPut } from "./client";
import type { Venue, VenueResponse, VenuesResponse } from "../types/venue";

export interface GetVenuesParams {
  page?: number;
  limit?: number;
  sort?: string;
  sortOrder?: "asc" | "desc";
  _owner?: boolean;
  _bookings?: boolean;
}

export interface CreateVenuePayload {
  name: string;
  description: string;
  media?: Array<{ url: string; alt: string }>;
  price: number;
  maxGuests: number;
  rating?: number;
  meta?: {
    wifi?: boolean;
    parking?: boolean;
    breakfast?: boolean;
    pets?: boolean;
  };
  location?: {
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    continent?: string;
    lat?: number;
    lng?: number;
  };
}

export function getVenues(params?: GetVenuesParams): Promise<VenuesResponse> {
  return apiGet<VenuesResponse>("/holidaze/venues", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export function getVenue(
  id: string,
  params?: { _owner?: boolean; _bookings?: boolean },
): Promise<VenueResponse> {
  return apiGet<VenueResponse>(`/holidaze/venues/${id}`, {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export function searchVenues(
  query: string,
  params?: GetVenuesParams,
): Promise<VenuesResponse> {
  return apiGet<VenuesResponse>("/holidaze/venues/search", {
    params: {
      q: query,
      ...(params as Record<string, string | number | boolean | undefined>),
    },
  });
}

export function deleteVenue(id: string): Promise<void> {
  return apiDelete<void>(`/holidaze/venues/${id}`);
}

export function createVenue(
  payload: CreateVenuePayload,
): Promise<VenueResponse> {
  return apiPost<VenueResponse>("/holidaze/venues", payload);
}

export function updateVenue(
  id: string,
  payload: CreateVenuePayload,
): Promise<VenueResponse> {
  return apiPut<VenueResponse>(`/holidaze/venues/${id}`, payload);
}

export type { Venue, VenuesResponse, VenueResponse };
