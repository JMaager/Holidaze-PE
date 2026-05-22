import { memo } from "react";
import { Link } from "react-router-dom";
import type { Venue } from "../types/venue";
import { buttonClasses } from "./ui/buttonClasses";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80";

interface VenueCardProps {
  venue: Venue;
  activeAmenities?: Array<keyof Venue["meta"]>;
  onAmenityClick?: (amenity: keyof Venue["meta"]) => void;
  priorityImage?: boolean;
}

const AMENITY_LABELS: Record<keyof Venue["meta"], string> = {
  wifi: "WiFi",
  parking: "Parking",
  breakfast: "Breakfast",
  pets: "Pets",
};

function VenueCardComponent({
  venue,
  activeAmenities = [],
  onAmenityClick,
  priorityImage = false,
}: VenueCardProps) {
  const image = venue.media[0]?.url ?? FALLBACK_IMG;
  const imageAlt = venue.media[0]?.alt || venue.name;
  const location = [venue.location.city, venue.location.country]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="flex flex-col rounded-2xl overflow-hidden border border-gray-200 bg-[#FFFFFF] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800">
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-100 sm:h-48">
        <img
          src={image}
          alt={imageAlt}
          className="h-full w-full object-cover"
          loading={priorityImage ? "eager" : "lazy"}
          fetchPriority={priorityImage ? "high" : "auto"}
          decoding="async"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
          }}
        />
        {/* Rating badge */}
        {venue.rating > 0 && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-gray-700 shadow">
            ⭐ {venue.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3.5 text-left sm:p-4">
        <h2 className="line-clamp-1 text-sm font-semibold text-gray-900 sm:text-base">
          {venue.name}
        </h2>

        {location && (
          <p className="inline-flex items-center gap-1 text-xs text-gray-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-3.5 w-3.5"
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

        <p className="line-clamp-2 flex-1 text-xs text-gray-600 sm:text-sm">
          {venue.description}
        </p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(venue.meta) as Array<keyof Venue["meta"]>)
            .filter((key) => venue.meta[key])
            .map((key) => {
              const isActive = activeAmenities.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onAmenityClick?.(key)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] sm:text-xs ${
                    isActive
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title={AMENITY_LABELS[key]}
                >
                  {AMENITY_LABELS[key]}
                </button>
              );
            })}
        </div>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-xs text-gray-600 sm:text-sm">
            Up to <strong className="text-gray-800">{venue.maxGuests}</strong>{" "}
            guests
          </span>
          <span className="text-right text-sm font-bold text-gray-900 sm:text-base">
            ${venue.price.toLocaleString()}
            <span className="ml-0.5 text-xs font-normal text-gray-600">
              /night
            </span>
          </span>
        </div>

        <Link
          to={`/venues/${venue.id}`}
          className={`${buttonClasses("primary", "sm")} mt-2 w-1/2 self-center text-[11px] min-h-0! px-[1em]! py-[0.7em]! leading-4.75!`}
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

export const VenueCard = memo(VenueCardComponent);
