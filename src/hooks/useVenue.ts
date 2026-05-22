import { useEffect, useReducer } from "react";
import { getVenue } from "../api/venues";
import type { Venue } from "../types/venue";
import { isApiError } from "../api/errors";

interface VenueState {
  venue: Venue | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

interface UseVenueResult {
  venue: Venue | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

type VenueAction =
  | { type: "LOADING" }
  | { type: "SUCCESS"; venue: Venue }
  | { type: "NOT_FOUND" }
  | { type: "ERROR"; error: string };

function venueReducer(_state: VenueState, action: VenueAction): VenueState {
  switch (action.type) {
    case "LOADING":
      return { venue: null, loading: true, error: null, notFound: false };
    case "SUCCESS":
      return {
        venue: action.venue,
        loading: false,
        error: null,
        notFound: false,
      };
    case "NOT_FOUND":
      return { venue: null, loading: false, error: null, notFound: true };
    case "ERROR":
      return {
        venue: null,
        loading: false,
        error: action.error,
        notFound: false,
      };
  }
}

export function useVenue(id: string): UseVenueResult {
  const [state, dispatch] = useReducer(venueReducer, {
    venue: null,
    loading: true,
    error: null,
    notFound: false,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    dispatch({ type: "LOADING" });

    getVenue(id, { _owner: true, _bookings: true })
      .then((res) => {
        if (!cancelled) dispatch({ type: "SUCCESS", venue: res.data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isApiError(err) && err.status === 404) {
          dispatch({ type: "NOT_FOUND" });
        } else {
          dispatch({
            type: "ERROR",
            error: isApiError(err) ? err.message : "Failed to load venue.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
