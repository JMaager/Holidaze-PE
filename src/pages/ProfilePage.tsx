import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile, updateProfile, type Profile } from "../api/profileApi";
import { getStoredProfile, setStoredProfile } from "../api/auth";
import { isApiError } from "../api/errors";
import { formatApiError } from "../utils/errors";
import { isValidImageUrl } from "../utils/validation";
import { FALLBACK_AVATAR } from "../constants/ui";

export function ProfilePage() {
  const storedProfile = getStoredProfile();
  const profileName = storedProfile?.name ?? "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarAlt, setAvatarAlt] = useState("");
  const [avatarSubmitting, setAvatarSubmitting] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);

  const blockedReason = useMemo(() => {
    if (!profileName) {
      return "You need to log in to view your profile.";
    }
    return null;
  }, [profileName]);

  useEffect(() => {
    if (!profileName) {
      return;
    }

    getProfile(profileName)
      .then((profileResponse) => {
        setProfile(profileResponse.data);
        setAvatarUrl(profileResponse.data.avatar?.url ?? "");
        setAvatarAlt(profileResponse.data.avatar?.alt ?? "");
      })
      .catch((err: unknown) => {
        setError(
          isApiError(err)
            ? formatApiError(err)
            : "Failed to load profile data.",
        );
      })
      .finally(() => setLoading(false));
  }, [profileName]);

  // Compute display state - show blocked reason immediately
  const displayLoading = useMemo(
    () => loading && !blockedReason,
    [loading, blockedReason],
  );
  const displayError = useMemo(
    () => blockedReason || error,
    [blockedReason, error],
  );

  const validateAvatarForm = (): string | null => {
    if (!avatarUrl.trim()) return "Avatar URL is required.";
    if (!isValidImageUrl(avatarUrl.trim()))
      return "Avatar URL must be a valid http/https URL.";
    if (!avatarAlt.trim()) return "Avatar alt text is required.";
    if (avatarAlt.trim().length < 3)
      return "Avatar alt text must be at least 3 characters.";
    return null;
  };

  const onAvatarSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAvatarSuccess(null);
    setDashboardError(null);

    const validationError = validateAvatarForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!profileName) {
      setDashboardError("You need to log in to update your avatar.");
      return;
    }

    try {
      setAvatarSubmitting(true);
      const response = await updateProfile(profileName, {
        avatar: {
          url: avatarUrl.trim(),
          alt: avatarAlt.trim(),
        },
      });

      setProfile(response.data);
      setAvatarSuccess("Avatar updated successfully.");

      setStoredProfile({
        name: response.data.name,
        email: response.data.email,
        venueManager: response.data.venueManager,
        avatar: response.data.avatar ?? undefined,
        banner: response.data.banner ?? undefined,
      });
    } catch (err: unknown) {
      setDashboardError(
        isApiError(err) ? formatApiError(err) : "Failed to update avatar.",
      );
    } finally {
      setAvatarSubmitting(false);
    }
  };

  if (displayLoading) {
    return (
      <main className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded bg-gray-200" />
          <div className="h-48 rounded-2xl bg-gray-200" />
          <div className="h-40 rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }

  if (displayError && !profile) {
    return (
      <main className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-medium">{displayError}</p>
          <p className="mt-2 text-sm">
            Go to{" "}
            <Link to="/login" className="underline">
              login
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="text-left">
          <h1 className="text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your profile information
          </p>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <img
            src={profile.avatar?.url || FALLBACK_AVATAR}
            alt={profile.avatar?.alt || profile.name}
            className="h-16 w-16 rounded-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_AVATAR;
            }}
          />
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 sm:px-4 sm:py-1.5 sm:text-sm">
            {profile.venueManager ? "Venue Manager" : "Customer"}
          </span>
        </div>

        <div className="mt-6 pt-6">
          <h3 className="text-left text-lg font-semibold text-gray-900">
            Edit Profile Avatar
          </h3>
          <p className="mt-1 text-left text-sm text-gray-500">
            Update your avatar image and alt text.
          </p>

          {(dashboardError || avatarSuccess) && (
            <div
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                dashboardError
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {dashboardError || avatarSuccess}
            </div>
          )}

          <form onSubmit={onAvatarSubmit} className="mt-4 space-y-3 text-left">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Avatar URL
              </span>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
                placeholder="https://..."
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Avatar Alt Text
              </span>
              <input
                type="text"
                value={avatarAlt}
                onChange={(e) => setAvatarAlt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
                placeholder="Describe your avatar"
                required
              />
            </label>

            <button
              type="submit"
              disabled={avatarSubmitting}
              className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {avatarSubmitting ? "Saving..." : "Save Avatar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
