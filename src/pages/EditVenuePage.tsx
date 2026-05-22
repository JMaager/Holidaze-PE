import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getStoredProfile } from "../api/auth";
import { buttonClasses } from "../components/ui/buttonClasses";
import { Modal } from "../components/ui/Modal";
import { isApiError } from "../api/errors";
import { deleteVenue, getVenue, updateVenue } from "../api/venues";
import { formatApiError } from "../utils/errors";
import { isValidHttpUrl } from "../utils/validation";

interface MediaField {
  url: string;
  alt: string;
}

interface VenueFormState {
  name: string;
  description: string;
  price: string;
  maxGuests: string;
  rating: string;
  address: string;
  city: string;
  country: string;
  wifi: boolean;
  parking: boolean;
  breakfast: boolean;
  pets: boolean;
}

const EMPTY_FORM: VenueFormState = {
  name: "",
  description: "",
  price: "",
  maxGuests: "",
  rating: "0",
  address: "",
  city: "",
  country: "",
  wifi: false,
  parking: false,
  breakfast: false,
  pets: false,
};

export function EditVenuePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = getStoredProfile();
  const textBoxClasses =
    "w-full rounded-lg border border-gray-300 !min-h-0 !pl-[1em] !py-[0.7em] text-base leading-[1em] sm:leading-[0.5em] !bg-[#D9D9D9] !text-[#555555] placeholder:!text-[#555555] focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200";

  const [form, setForm] = useState<VenueFormState>(EMPTY_FORM);
  const [media, setMedia] = useState<MediaField[]>([{ url: "", alt: "" }]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const blockedReason = useMemo(() => {
    if (!id) return "Invalid venue id.";
    if (!profile) return "You need to log in to edit a venue.";
    if (!profile.venueManager) return "Only venue managers can edit venues.";
    return null;
  }, [id, profile]);

  useEffect(() => {
    if (!id) {
      return;
    }

    getVenue(id, { _owner: true })
      .then((response) => {
        const venue = response.data;

        if (
          profile?.name &&
          venue.owner?.name &&
          venue.owner.name !== profile.name
        ) {
          setError("You can only edit venues that you own.");
          return;
        }

        setForm({
          name: venue.name ?? "",
          description: venue.description ?? "",
          price: String(venue.price ?? 0),
          maxGuests: String(venue.maxGuests ?? 1),
          rating: String(venue.rating ?? 0),
          address: venue.location.address ?? "",
          city: venue.location.city ?? "",
          country: venue.location.country ?? "",
          wifi: Boolean(venue.meta.wifi),
          parking: Boolean(venue.meta.parking),
          breakfast: Boolean(venue.meta.breakfast),
          pets: Boolean(venue.meta.pets),
        });

        setMedia(
          venue.media.length > 0
            ? venue.media.map((item) => ({ url: item.url, alt: item.alt }))
            : [{ url: "", alt: "" }],
        );
      })
      .catch((err: unknown) => {
        setError(
          isApiError(err) ? formatApiError(err) : "Failed to load venue.",
        );
      })
      .finally(() => setLoading(false));
  }, [id, profile?.name]);

  const updateField = <K extends keyof VenueFormState>(
    key: K,
    value: VenueFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  const updateMediaField = (
    index: number,
    key: keyof MediaField,
    value: string,
  ) => {
    setMedia((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
    setSuccess(null);
  };

  const addMediaField = () => {
    setMedia((prev) => [...prev, { url: "", alt: "" }]);
  };

  const removeMediaField = (index: number) => {
    setMedia((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
    setSuccess(null);
  };

  const validate = (): string | null => {
    if (blockedReason) return blockedReason;
    if (!id) return "Invalid venue id.";
    if (!form.name.trim()) return "Venue name is required.";
    if (form.name.trim().length < 3)
      return "Venue name must be at least 3 characters.";
    if (!form.description.trim()) return "Description is required.";
    if (form.description.trim().length < 20)
      return "Description must be at least 20 characters.";

    const price = Number(form.price);
    if (!form.price || Number.isNaN(price) || price < 0) {
      return "Price must be a valid number equal to or above 0.";
    }

    const maxGuests = Number(form.maxGuests);
    if (!form.maxGuests || Number.isNaN(maxGuests) || maxGuests < 1) {
      return "Max guests must be at least 1.";
    }

    if (form.rating) {
      const rating = Number(form.rating);
      if (Number.isNaN(rating) || rating < 0 || rating > 5) {
        return "Rating must be between 0 and 5.";
      }
    }

    for (const [index, item] of media.entries()) {
      const hasUrl = item.url.trim().length > 0;
      const hasAlt = item.alt.trim().length > 0;
      if (hasUrl && !isValidHttpUrl(item.url.trim())) {
        return `Media URL #${index + 1} must be a valid http/https URL.`;
      }
      if (hasUrl && !hasAlt) {
        return `Media alt text #${index + 1} is required when URL is provided.`;
      }
      if (!hasUrl && hasAlt) {
        return `Media URL #${index + 1} is required when alt text is provided.`;
      }
    }

    return null;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!id) return;

    try {
      setSubmitting(true);

      const sanitizedMedia = media
        .map((item) => ({ url: item.url.trim(), alt: item.alt.trim() }))
        .filter((item) => item.url && item.alt);

      await updateVenue(id, {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        maxGuests: Number(form.maxGuests),
        rating: form.rating ? Number(form.rating) : 0,
        media: sanitizedMedia.length > 0 ? sanitizedMedia : undefined,
        meta: {
          wifi: form.wifi,
          parking: form.parking,
          breakfast: form.breakfast,
          pets: form.pets,
        },
        location: {
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          country: form.country.trim() || undefined,
        },
      });

      setSuccess("Venue updated successfully.");
    } catch (err: unknown) {
      setError(
        isApiError(err) ? formatApiError(err) : "Failed to update venue.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteVenue = async () => {
    if (blockedReason || deleting) return;
    setDeleteModalOpen(true);
  };

  const confirmDeleteVenue = async () => {
    if (blockedReason || !id || deleting) return;

    setError(null);
    setSuccess(null);

    try {
      setDeleting(true);
      await deleteVenue(id);
      setDeleteModalOpen(false);
      navigate("/my-venues", { replace: true });
    } catch (err: unknown) {
      setError(
        isApiError(err) ? formatApiError(err) : "Failed to delete venue.",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded bg-gray-200" />
          <div className="h-56 rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-8 text-left sm:px-6 lg:px-8">
      {blockedReason ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-medium">{blockedReason}</p>
          {!profile && (
            <p className="mt-2 text-sm">
              Go to{" "}
              <Link to="/login" className="underline">
                login
              </Link>
              .
            </p>
          )}
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="pb-0 text-gray-900">Edit Venue</h1>
              <p className="mt-1 text-sm text-gray-500">
                Update your accommodation details and listings
              </p>
            </div>
            <button
              type="button"
              onClick={onDeleteVenue}
              disabled={deleting || submitting}
              className={`${buttonClasses("danger", "sm")} min-h-0 shrink-0 px-[1em] py-[0.5em] text-[11px] leading-none`}
            >
              {deleting ? "Deleting..." : "Delete venue"}
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Venue Name
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Luxury Villa"
                className={textBoxClasses}
                required
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
                placeholder="Describe your venue, it's features, and what makes it special..."
                className={textBoxClasses}
                required
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Price per Night ($)
              </span>
              <input
                type="number"
                min={0}
                step="1"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="199"
                className={textBoxClasses}
                required
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Max Guests
              </span>
              <input
                type="number"
                min={1}
                step="1"
                value={form.maxGuests}
                onChange={(e) => updateField("maxGuests", e.target.value)}
                placeholder="4"
                className={textBoxClasses}
                required
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Rating (0-5)
              </span>
              <input
                type="number"
                min={0}
                max={5}
                step="0.1"
                value={form.rating}
                onChange={(e) => updateField("rating", e.target.value)}
                className={textBoxClasses}
              />
            </label>
          </section>

          <section>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Location (Optional)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Address
                </span>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="123 Beach Road"
                  className={textBoxClasses}
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  City
                </span>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Miami"
                  className={textBoxClasses}
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Country
                </span>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  placeholder="USA"
                  className={textBoxClasses}
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Amenities
            </h3>
            <div className="grid max-w-88 grid-cols-2 gap-x-8 gap-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.wifi}
                  onChange={(e) => updateField("wifi", e.target.checked)}
                  className="h-4 w-4"
                />
                WiFi
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.parking}
                  onChange={(e) => updateField("parking", e.target.checked)}
                  className="h-4 w-4"
                />
                Parking
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.breakfast}
                  onChange={(e) => updateField("breakfast", e.target.checked)}
                  className="h-4 w-4"
                />
                Breakfast
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.pets}
                  onChange={(e) => updateField("pets", e.target.checked)}
                  className="h-4 w-4"
                />
                Pet Friendly
              </label>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Images / Media
              </h3>
              <button
                type="button"
                onClick={addMediaField}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900"
              >
                Add Image
              </button>
            </div>

            <div className="space-y-3">
              {media.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <input
                    type="url"
                    value={item.url}
                    onChange={(e) =>
                      updateMediaField(index, "url", e.target.value)
                    }
                    placeholder="https://example.com/image.jpg"
                    className={textBoxClasses}
                  />
                  <input
                    type="text"
                    value={item.alt}
                    onChange={(e) =>
                      updateMediaField(index, "alt", e.target.value)
                    }
                    placeholder="Image alt text"
                    className={textBoxClasses}
                  />
                  <button
                    type="button"
                    onClick={() => removeMediaField(index)}
                    disabled={media.length === 1}
                    className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-1"
            >
              {submitting ? "Saving changes..." : "Update Venue"}
            </button>
            <Link
              to="/my-venues"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}

      <Modal
        open={deleteModalOpen}
        title="Delete venue"
        description="Are you sure you want to delete this venue? This action cannot be undone."
        onClose={() => {
          if (!deleting) setDeleteModalOpen(false);
        }}
        actions={
          <>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className={buttonClasses("secondary", "sm")}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteVenue}
              disabled={deleting}
              className={buttonClasses("danger", "sm")}
            >
              {deleting ? "Deleting..." : "Delete venue"}
            </button>
          </>
        }
      />
    </main>
  );
}
