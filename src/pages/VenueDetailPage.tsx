import { useParams, useNavigate, Link } from "react-router-dom";
import { useVenue } from "../hooks/useVenue";
import type { Venue } from "../types/venue";
import { useEffect, useMemo, useState } from "react";
import { DayPicker, type DateRange, type Matcher } from "react-day-picker";
import {
  differenceInCalendarDays,
  format,
  isBefore,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import "react-day-picker/dist/style.css";
import { createBooking } from "../api/bookings";
import { getStoredProfile, isAuthenticated } from "../api/auth";
import { isApiError } from "../api/errors";
import { formatApiError } from "../utils/errors";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80";

const AMENITY_LABELS: Record<keyof Venue["meta"], string> = {
  wifi: "WiFi",
  parking: "Parking",
  breakfast: "Breakfast",
  pets: "Pets",
};

export function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { venue, loading, error, notFound } = useVenue(id ?? "");
  const [activeImg, setActiveImg] = useState(0);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [existingBookings, setExistingBookings] = useState(
    venue?.bookings ?? [],
  );
  const [guests, setGuests] = useState(1);
  const [guestFieldError, setGuestFieldError] = useState<string | null>(null);
  const [dateFieldError, setDateFieldError] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Initialize booking form state based on venue
  const initialBookingState = useMemo(
    () => ({
      bookings: venue?.bookings ?? [],
      success: null,
      error: null,
      selectedRange: undefined,
      selectionError: null,
      guests: 1,
      guestFieldError: null,
      dateFieldError: null,
    }),
    [venue?.bookings],
  );

  // Form reset when venue changes - valid exception to set-state-in-effect rule
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExistingBookings(initialBookingState.bookings);
    setBookingSuccess(initialBookingState.success);
    setBookingError(initialBookingState.error);
    setSelectedRange(initialBookingState.selectedRange);
    setSelectionError(initialBookingState.selectionError);
    setGuests(initialBookingState.guests);
    setGuestFieldError(initialBookingState.guestFieldError);
    setDateFieldError(initialBookingState.dateFieldError);
  }, [initialBookingState]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full px-4 py-10 sm:px-6 lg:px-8 animate-pulse space-y-6">
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="h-80 w-full rounded-2xl bg-gray-200" />
        <div className="h-8 w-2/3 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
      </div>
    );
  }

  // ── 404 ───────────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-5xl">🏚️</p>
        <h2 className="text-2xl font-bold text-gray-800">Venue not found</h2>
        <p className="text-sm text-gray-500">
          The venue ID <span className="font-mono font-semibold">{id}</span>{" "}
          does not exist.
        </p>
        <Link
          to="/"
          className="mt-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Back to venues
        </Link>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !venue) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-lg font-medium text-red-600">Something went wrong</p>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  const images =
    venue.media.length > 0
      ? venue.media
      : [{ url: FALLBACK_IMG, alt: venue.name }];
  const location = [
    venue.location.address,
    venue.location.city,
    venue.location.country,
  ]
    .filter(Boolean)
    .join(", ");
  const today = startOfDay(new Date());
  const bookings = existingBookings;

  const bookedRanges = bookings
    .map((booking) => {
      const from = startOfDay(parseISO(booking.dateFrom));
      const to = subDays(startOfDay(parseISO(booking.dateTo)), 1);
      return { from, to };
    })
    .filter((range) => !isBefore(range.to, range.from));

  const disabledDays: Matcher[] = [{ before: today }, ...bookedRanges];

  const handleRangeSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    setSelectionError(null);
    setDateFieldError(null);

    if (!range?.from || !range.to) {
      setDateFieldError("Please select check-in and check-out dates.");
      return;
    }
    const rangeFrom = range.from;
    const rangeTo = range.to;

    if (!isBefore(rangeFrom, rangeTo)) {
      setSelectionError("Check-out must be after check-in.");
      setDateFieldError("Check-out must be after check-in.");
      return;
    }

    const overlapsExistingBooking = bookings.some((booking) => {
      const bookingFrom = startOfDay(parseISO(booking.dateFrom));
      const bookingTo = startOfDay(parseISO(booking.dateTo));
      return rangeFrom < bookingTo && rangeTo > bookingFrom;
    });

    if (overlapsExistingBooking) {
      setSelectionError(
        "Those dates are not available. Please choose another range.",
      );
      setDateFieldError("Those dates overlap an existing booking.");
    }
  };

  const nights =
    selectedRange?.from && selectedRange?.to
      ? differenceInCalendarDays(selectedRange.to, selectedRange.from)
      : 0;

  const canReserve =
    Boolean(selectedRange?.from && selectedRange?.to) &&
    !selectionError &&
    nights > 0 &&
    guests >= 1 &&
    guests <= venue.maxGuests;

  const handleBookNow = async () => {
    setBookingError(null);
    setBookingSuccess(null);
    setDateFieldError(null);
    setGuestFieldError(null);

    if (!isAuthenticated()) {
      setBookingError("Please log in to complete your booking.");
      return;
    }

    if (!id || !selectedRange?.from || !selectedRange?.to) {
      setDateFieldError("Please select valid check-in and check-out dates.");
      setBookingError("Please fix booking form errors.");
      return;
    }
    const selectedFrom = selectedRange.from;
    const selectedTo = selectedRange.to;

    if (selectionError) {
      setBookingError(selectionError);
      return;
    }

    if (guests < 1 || guests > venue.maxGuests) {
      setGuestFieldError(`Guests must be between 1 and ${venue.maxGuests}.`);
      setBookingError("Please fix booking form errors.");
      return;
    }

    // Double-check overlap right before API call.
    const overlapsExistingBooking = bookings.some((booking) => {
      const bookingFrom = startOfDay(parseISO(booking.dateFrom));
      const bookingTo = startOfDay(parseISO(booking.dateTo));
      return selectedFrom < bookingTo && selectedTo > bookingFrom;
    });

    if (overlapsExistingBooking) {
      setDateFieldError("Selected dates overlap with an existing booking.");
      setBookingError("Please fix booking form errors.");
      return;
    }

    try {
      setBookingSubmitting(true);

      const response = await createBooking({
        venueId: id,
        dateFrom: selectedFrom.toISOString(),
        dateTo: selectedTo.toISOString(),
        guests,
      });

      setExistingBookings((prev) => [...prev, response.data]);
      const profileName = getStoredProfile()?.name || "Customer";
      setBookingSuccess(
        `Booking confirmed for ${profileName}: ${format(selectedFrom, "MMM d, yyyy")} - ${format(selectedTo, "MMM d, yyyy")}.`,
      );
      setSelectedRange(undefined);
      setGuests(1);
    } catch (err: unknown) {
      setBookingError(
        isApiError(err)
          ? `Server error: ${formatApiError(err)}`
          : "Failed to submit booking request.",
      );
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <article className="w-full px-4 py-8 text-left sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        All venues
      </Link>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* ── Gallery ── */}
        <div className="space-y-2 lg:col-span-2">
          <div className="relative h-72 overflow-hidden rounded-2xl bg-gray-100 sm:h-96">
            <img
              src={images[activeImg]?.url ?? FALLBACK_IMG}
              alt={images[activeImg]?.alt || venue.name}
              className="h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              sizes="(min-width: 1024px) 66vw, 100vw"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
              }}
            />
            {venue.rating > 0 && (
              <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-gray-700 shadow">
                ⭐ {venue.rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === activeImg ? "border-gray-800" : "border-transparent"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || `Photo ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Pricing + booking container ── */}
        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-3xl font-bold text-gray-900">
            ${venue.price.toLocaleString()}
            <span className="ml-1 text-base font-normal text-gray-500">
              /night
            </span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Up to <strong className="text-gray-800">{venue.maxGuests}</strong>{" "}
            guests
          </p>

          {bookings.length > 0 && (
            <>
              <hr className="my-4 border-gray-100" />
              <div>
                <p className="text-xs font-medium text-gray-700">
                  Upcoming booked dates
                </p>
                <ul className="mt-1 space-y-1 text-xs text-gray-500">
                  {bookings
                    .slice()
                    .sort((a, b) => a.dateFrom.localeCompare(b.dateFrom))
                    .slice(0, 4)
                    .map((booking) => (
                      <li key={booking.id}>
                        {format(parseISO(booking.dateFrom), "MMM d")} -{" "}
                        {format(
                          subDays(parseISO(booking.dateTo), 1),
                          "MMM d, yyyy",
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            </>
          )}
        </aside>
      </div>

      <div className="mt-8 space-y-6">
        <div>
          <h1 className="text-gray-900">{venue.name}</h1>
          {location && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-gray-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {location}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-base leading-relaxed text-gray-700">
            {venue.description || "No description provided."}
          </p>

          <div>
            <h2 className="mb-3 px-0 py-2 text-lg font-semibold text-gray-800">
              Location details
            </h2>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-32 gap-y-2 text-sm text-gray-600">
              {venue.location.address && (
                <>
                  <dt>Address</dt>
                  <dd className="font-medium text-gray-800">
                    {venue.location.address}
                  </dd>
                </>
              )}
              {venue.location.city && (
                <>
                  <dt>City</dt>
                  <dd className="font-medium text-gray-800">
                    {venue.location.city}
                  </dd>
                </>
              )}
              {venue.location.country && (
                <>
                  <dt>Country</dt>
                  <dd className="font-medium text-gray-800">
                    {venue.location.country}
                  </dd>
                </>
              )}
              {venue.location.zip && (
                <>
                  <dt>ZIP</dt>
                  <dd className="font-medium text-gray-800">
                    {venue.location.zip}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">
            Amenities
          </h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(venue.meta) as Array<keyof Venue["meta"]>)
              .filter((key) => venue.meta[key])
              .map((key) => (
                <span
                  key={key}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {AMENITY_LABELS[key]}
                </span>
              ))}
          </div>
        </div>

        {/* Availability calendar */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-800">Availability</h2>
          <p className="mt-1 text-xs text-gray-500">
            Booked dates are disabled. Pick your check-in and check-out range.
          </p>

          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 p-2">
            <DayPicker
              mode="range"
              selected={selectedRange}
              onSelect={handleRangeSelect}
              disabled={disabledDays}
              numberOfMonths={1}
              showOutsideDays
              className="mx-auto"
              classNames={{
                day: "bg-white p-px",
                day_button:
                  "h-8 w-8 rounded-md border border-white text-sm disabled:bg-rose-200 disabled:text-rose-700 aria-selected:bg-gray-200 aria-selected:text-gray-800",
                selected:
                  "bg-transparent text-gray-800 [&>button]:bg-gray-200 [&>button]:text-gray-800",
                range_start:
                  "bg-transparent text-gray-800 [&>button]:bg-gray-200 [&>button]:text-gray-800",
                range_end:
                  "bg-transparent text-gray-800 [&>button]:bg-gray-200 [&>button]:text-gray-800",
                range_middle:
                  "bg-transparent [&>button]:bg-gray-200 [&>button]:text-gray-800",
                today: "border border-gray-500",
                disabled: "opacity-100",
                chevron: "fill-gray-700",
                caption_label: "text-sm font-semibold",
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-gray-600">
              <span className="h-3 w-3 rounded-full bg-gray-200" /> Selected
              range
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-600">
              <span className="h-3 w-3 rounded-full bg-rose-200" /> Booked
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-600">
              <span className="h-3 w-3 rounded-full border border-gray-300 bg-white" />
              Available
            </span>
          </div>

          {selectionError && (
            <p className="mt-2 text-xs font-medium text-red-600">
              {selectionError}
            </p>
          )}

          {dateFieldError && (
            <p className="mt-1 text-xs text-red-600">{dateFieldError}</p>
          )}

          {!selectionError && selectedRange?.from && selectedRange?.to && (
            <p className="mt-2 text-xs text-gray-600">
              {format(selectedRange.from, "MMM d, yyyy")} -{" "}
              {format(selectedRange.to, "MMM d, yyyy")} ({nights} night
              {nights === 1 ? "" : "s"})
            </p>
          )}

          <div className="mt-4 max-w-xs">
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Guests
            </label>
            <input
              type="number"
              min={1}
              max={venue.maxGuests}
              value={guests}
              onChange={(e) => {
                setGuests(Number(e.target.value));
                setGuestFieldError(null);
                setBookingError(null);
                setBookingSuccess(null);
              }}
              aria-invalid={Boolean(guestFieldError)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              Max {venue.maxGuests} guests
            </p>
            {guestFieldError && (
              <p className="mt-1 text-xs text-red-600">{guestFieldError}</p>
            )}
          </div>

          {(bookingError || bookingSuccess) && (
            <div
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                bookingError
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {bookingError || bookingSuccess}
            </div>
          )}

          <button
            className="mt-6 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            onClick={handleBookNow}
            disabled={!canReserve || bookingSubmitting}
          >
            {bookingSubmitting ? "Booking..." : "Reserve"}
          </button>

          {!canReserve && (
            <p className="mt-2 text-xs text-gray-500">
              Select valid available dates to continue.
            </p>
          )}
        </section>

        {/* Owner */}
        {venue.owner && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              Hosted by
            </h2>
            <div className="flex items-center gap-4">
              {venue.owner.avatar?.url ? (
                <img
                  src={venue.owner.avatar.url}
                  alt={venue.owner.avatar.alt || venue.owner.name}
                  className="h-12 w-12 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
                  {venue.owner.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {venue.owner.name}
                </p>
                <p className="text-sm text-gray-500">{venue.owner.email}</p>
                {venue.owner.bio && (
                  <p className="mt-1 text-sm text-gray-600">
                    {venue.owner.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
