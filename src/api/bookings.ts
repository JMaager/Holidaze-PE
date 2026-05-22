import { apiPost } from "./client";

export interface CreateBookingPayload {
  dateFrom: string;
  dateTo: string;
  guests: number;
  venueId: string;
}

export interface BookingResponse {
  data: {
    id: string;
    dateFrom: string;
    dateTo: string;
    guests: number;
    created: string;
    updated: string;
  };
  meta: Record<string, never>;
}

export function createBooking(
  payload: CreateBookingPayload,
): Promise<BookingResponse> {
  return apiPost<BookingResponse>("/holidaze/bookings", payload);
}
