import { useEffect, useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { Link } from "react-router-dom";
import { getStoredProfile } from "../api/auth";
import { isApiError } from "../api/errors";
import {
  getCustomerBookings,
  getManagedVenues,
  type ProfileVenueSummary,
} from "../api/profileApi";
import { buttonClasses } from "../components/ui/buttonClasses";
import { formatApiError } from "../utils/errors";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80";

export function MyVenuesPage() {
  const storedProfile = getStoredProfile();
  const profileName = storedProfile?.name ?? "";
  const isVenueManager = storedProfile?.venueManager ?? false;

  const [venues, setVenues] = useState<
    Array<{
      id: string;
      name: string;
      media: Array<{ url: string; alt: string }>;
      location: { city: string | null; country: string | null };
      price?: number;
      canEdit: boolean;
      bookings: Array<{ id: string; dateFrom: string; dateTo: string }>;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const blockedReason = useMemo(() => {
    if (!profileName) {
      return "You need to log in to view your venues.";
    }
    return null;
  }, [profileName]);

  useEffect(() => {
    if (!profileName) {
      return;
    }

    const loadVenues = isVenueManager
      ? getManagedVenues(profileName).then((response) => {
          setVenues(
            response.data.map((venue) => {
              const filteredBookings = (venue.bookings ?? []).filter(
                (booking) => booking.customer?.name !== profileName,
              );
              const dedupedBookings = Array.from(
                new Map(
                  filteredBookings.map((booking) => [
                    `${booking.dateFrom}|${booking.dateTo}`,
                    booking,
                  ]),
                ).values(),
              );

              return {
                id: venue.id,
                name: venue.name,
                media: venue.media,
                location: venue.location,
                price: venue.price,
                canEdit: true,
                bookings: dedupedBookings.map((booking) => ({
                  id: booking.id,
                  dateFrom: booking.dateFrom,
                  dateTo: booking.dateTo,
                })),
              };
            }),
          );
        })
      : getCustomerBookings(profileName).then((response) => {
          const venuesById = new Map<
            string,
            {
              venue: ProfileVenueSummary;
              bookings: Array<{ id: string; dateFrom: string; dateTo: string }>;
            }
          >();

          response.data.forEach((booking) => {
            if (booking.venue?.id) {
              const existing = venuesById.get(booking.venue.id);
              if (existing) {
                existing.bookings.push({
                  id: booking.id,
                  dateFrom: booking.dateFrom,
                  dateTo: booking.dateTo,
                });
              } else {
                venuesById.set(booking.venue.id, {
                  venue: booking.venue,
                  bookings: [
                    {
                      id: booking.id,
                      dateFrom: booking.dateFrom,
                      dateTo: booking.dateTo,
                    },
                  ],
                });
              }
            }
          });

          setVenues(
            Array.from(venuesById.values()).map(({ venue, bookings }) => ({
              id: venue.id,
              name: venue.name,
              media: venue.media,
              location: venue.location,
              canEdit: false,
              bookings,
            })),
          );
        });

    loadVenues
      .catch((err: unknown) => {
        setError(
          isApiError(err) ? formatApiError(err) : "Failed to load your venues.",
        );
      })
      .finally(() => setLoading(false));
  }, [profileName, isVenueManager]);

  // Compute display state - show blocked reason immediately
  const displayLoading = useMemo(
    () => loading && !blockedReason,
    [loading, blockedReason],
  );
  const displayError = useMemo(
    () => blockedReason || error,
    [blockedReason, error],
  );

  if (displayLoading) {
    return (
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-40 rounded bg-gray-200" />
          <div className="h-28 rounded-xl bg-gray-200" />
          <div className="h-28 rounded-xl bg-gray-200" />
        </div>
      </main>
    );
  }

  if (displayError) {
    return (
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-medium">{displayError}</p>
          <p className="mt-2 text-sm">
            Go to{" "}
            <Link to="/" className="underline">
              Browse Venues
            </Link>
            .
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-left">
          <h1 className="text-gray-900">My Venues</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isVenueManager
              ? "Venues you have created as a manager."
              : "Manage your booked listings"}
          </p>
        </div>

        {isVenueManager && (
          <Link
            to="/venues/create"
            className={`${buttonClasses("primary", "sm")} gap-2`}
          >
            <span aria-hidden="true" className="text-base leading-none">
              +
            </span>
            Create New Venue
          </Link>
        )}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {venues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="text-base font-medium text-gray-700">
              {isVenueManager ? "No venues yet" : "No venues booked yet"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {isVenueManager
                ? "Start by creating your first venue."
                : "Start by booking your first venue"}
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <li
                key={venue.id}
                className="rounded-xl border border-gray-200 bg-white p-3"
              >
                <img
                  src={venue.media?.[0]?.url || FALLBACK_IMAGE}
                  alt={venue.media?.[0]?.alt || venue.name}
                  className="h-36 w-full rounded-lg object-cover"
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).src =
                      FALLBACK_IMAGE;
                  }}
                />
                <h3 className="mt-3 text-base font-semibold text-gray-900">
                  {venue.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {venue.location?.city || "Unknown city"}
                  {venue.location?.country ? `, ${venue.location.country}` : ""}
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  {typeof venue.price === "number"
                    ? `$${venue.price} / night`
                    : "Booked venue"}
                </p>

                {venue.bookings.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700">
                      {isVenueManager
                        ? "All booked times"
                        : "Your booked times"}
                    </p>
                    <ul className="mt-1 space-y-1 text-xs text-gray-500">
                      {venue.bookings
                        .slice()
                        .sort((a, b) => a.dateFrom.localeCompare(b.dateFrom))
                        .map((booking) => (
                          <li key={booking.id}>
                            {format(parseISO(booking.dateFrom), "MMM d, yyyy")}{" "}
                            -{" "}
                            {format(
                              subDays(parseISO(booking.dateTo), 1),
                              "MMM d, yyyy",
                            )}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <Link
                    to={`/venues/${venue.id}`}
                    className="text-sm font-medium text-gray-900 underline"
                  >
                    View Details
                  </Link>
                  {venue.canEdit && (
                    <Link
                      to={`/venues/${venue.id}/edit`}
                      className="text-sm font-medium text-gray-700 underline"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
