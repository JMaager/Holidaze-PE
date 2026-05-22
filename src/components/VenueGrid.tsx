import { useEffect, useMemo, useState } from "react";
import { useVenues } from "../hooks/useVenues";
import { VenueCard } from "./VenueCard";
import { buttonClasses } from "./ui/buttonClasses";
import type { Venue } from "../types/venue";

interface VenueGridProps {
  query?: string;
  sortBy?: "priceAsc" | "priceDesc" | "recent";
  amenityFilters?: Array<keyof Venue["meta"]>;
  onAmenityClick?: (amenity: keyof Venue["meta"]) => void;
}

const VENUES_PER_PAGE = 15;
const AMENITY_FILTER_FETCH_LIMIT = 100;

type PaginationItem = number | "ellipsis";

function buildPaginationItems(
  currentPage: number,
  pageCount: number,
): PaginationItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, pageCount]);

  const startPage = Math.max(2, currentPage - 2);
  const endPage = Math.min(pageCount - 1, currentPage + 2);

  for (let page = startPage; page <= endPage; page += 1) {
    pages.add(page);
  }

  const orderedPages = Array.from(pages).sort((a, b) => a - b);
  const items: PaginationItem[] = [];

  orderedPages.forEach((page, index) => {
    const previous = orderedPages[index - 1];
    if (previous && page - previous > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  });

  return items;
}

export function VenueGrid({
  query,
  sortBy = "priceAsc",
  amenityFilters = [],
  onAmenityClick,
}: VenueGridProps) {
  const [page, setPage] = useState(1);
  const isAmenityFiltering = amenityFilters.length > 0;
  const { venues, meta, loading, error, refetch } = useVenues(
    isAmenityFiltering
      ? { limit: AMENITY_FILTER_FETCH_LIMIT, page: 1 }
      : { limit: VENUES_PER_PAGE, page, query },
  );

  // Track filter changes and reset page when they change
  const currentFiltersStr = JSON.stringify([query, sortBy, amenityFilters]);
  const [prevFiltersRef] = useState(() => ({ current: currentFiltersStr }));

  useEffect(() => {
    if (prevFiltersRef.current !== currentFiltersStr) {
      prevFiltersRef.current = currentFiltersStr;
      setPage(1);
    }
  }, [currentFiltersStr, prevFiltersRef]);

  const filteredVenues = useMemo(
    () =>
      amenityFilters.length
        ? venues.filter((venue) =>
            amenityFilters.every((key) => venue.meta[key]),
          )
        : venues,
    [amenityFilters, venues],
  );

  const sortedVenues = useMemo(
    () =>
      [...filteredVenues].sort((a, b) =>
        sortBy === "priceAsc"
          ? a.price - b.price
          : sortBy === "priceDesc"
            ? b.price - a.price
            : new Date(b.created).getTime() - new Date(a.created).getTime(),
      ),
    [filteredVenues, sortBy],
  );

  const pageCount = isAmenityFiltering
    ? Math.max(1, Math.ceil(sortedVenues.length / VENUES_PER_PAGE))
    : (meta?.pageCount ?? 1);

  // Compute and enforce valid page range
  const validPage = useMemo(() => Math.min(page, pageCount), [page, pageCount]);

  const visibleVenues = useMemo(
    () =>
      isAmenityFiltering
        ? sortedVenues.slice(
            (validPage - 1) * VENUES_PER_PAGE,
            validPage * VENUES_PER_PAGE,
          )
        : sortedVenues,
    [isAmenityFiltering, validPage, sortedVenues],
  );

  const paginationItems = useMemo(
    () => buildPaginationItems(validPage, pageCount),
    [validPage, pageCount],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-2xl bg-gray-200 sm:h-80"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-medium text-red-600">Something went wrong</p>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={refetch}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (visibleVenues.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="text-lg font-medium text-gray-700">No venues found</p>
        {query && (
          <p className="text-sm text-gray-500">
            No results for <span className="font-semibold">"{query}"</span>. Try
            a different search.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {visibleVenues.map((venue, index) => (
          <VenueCard
            key={venue.id}
            venue={venue}
            activeAmenities={amenityFilters}
            onAmenityClick={onAmenityClick}
            priorityImage={index === 0}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {paginationItems.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-sm text-gray-500"
                >
                  ...
                </span>
              );
            }

            const isActive = item === page;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                aria-current={isActive ? "page" : undefined}
                className={`${buttonClasses(isActive ? "primary" : "secondary", "sm")} min-w-10 px-3 ${isActive ? "pointer-events-none" : "hover:underline underline-offset-4"}`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
