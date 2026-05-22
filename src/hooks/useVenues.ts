import { useEffect, useReducer, useState } from "react";
import { getVenues, searchVenues, type GetVenuesParams } from "../api/venues";
import type { Venue, NoroffMeta } from "../types/venue";
import { isApiError } from "../api/errors";

interface VenuesState {
  venues: Venue[];
  meta: NoroffMeta | null;
  loading: boolean;
  error: string | null;
}

interface UseVenuesResult {
  venues: Venue[];
  meta: NoroffMeta | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseVenuesOptions extends GetVenuesParams {
  /** When provided, uses the search endpoint instead of listing all venues. */
  query?: string;
}

type VenuesAction =
  | { type: "LOADING" }
  | { type: "SUCCESS"; venues: Venue[]; meta: NoroffMeta }
  | { type: "ERROR"; error: string };

function venuesReducer(_state: VenuesState, action: VenuesAction): VenuesState {
  switch (action.type) {
    case "LOADING":
      return { venues: [], meta: null, loading: true, error: null };
    case "SUCCESS":
      return {
        venues: action.venues,
        meta: action.meta,
        loading: false,
        error: null,
      };
    case "ERROR":
      return { venues: [], meta: null, loading: false, error: action.error };
  }
}

export function useVenues(options?: UseVenuesOptions): UseVenuesResult {
  const { query, ...params } = options ?? {};
  const { page, limit, sort, sortOrder, _owner, _bookings } = params;

  const [state, dispatch] = useReducer(venuesReducer, {
    venues: [],
    meta: null,
    loading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "LOADING" });

    const request =
      query && query.trim().length > 0
        ? searchVenues(query.trim(), params)
        : getVenues(params);

    request
      .then((res) => {
        if (!cancelled) {
          dispatch({ type: "SUCCESS", venues: res.data, meta: res.meta });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "ERROR",
            error: isApiError(err) ? err.message : "Failed to load venues.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page, limit, sort, sortOrder, _owner, _bookings, tick]);

  return { ...state, refetch: () => setTick((t) => t + 1) };
}
