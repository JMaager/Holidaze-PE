import { Suspense, lazy, useCallback, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VenueGrid } from "./components/VenueGrid";
import { SearchInput } from "./components/SearchInput";
import { useDebounce } from "./hooks/useDebounce";
import { clearAuth, getStoredProfile, isAuthenticated } from "./api/auth";
import { Navbar } from "./components/ui/Navbar";
import { Footer } from "./components/ui/Footer";
import { buttonClasses } from "./components/ui/buttonClasses";

type AmenityKey = "wifi" | "parking" | "breakfast" | "pets";
type SortOption = "priceAsc" | "priceDesc" | "recent";

const AMENITY_LABELS: Record<AmenityKey, string> = {
  wifi: "WiFi",
  parking: "Parking",
  breakfast: "Breakfast",
  pets: "Pets",
};

const SORT_LABEL_MAP: Record<SortOption, string> = {
  priceAsc: "Price Low-High",
  priceDesc: "Price High-Low",
  recent: "Newest",
};

const VenueDetailPage = lazy(() =>
  import("./pages/VenueDetailPage").then((module) => ({
    default: module.VenueDetailPage,
  })),
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((module) => ({
    default: module.RegisterPage,
  })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);
const CreateVenuePage = lazy(() =>
  import("./pages/CreateVenuePage").then((module) => ({
    default: module.CreateVenuePage,
  })),
);
const EditVenuePage = lazy(() =>
  import("./pages/EditVenuePage").then((module) => ({
    default: module.EditVenuePage,
  })),
);
const MyVenuesPage = lazy(() =>
  import("./pages/MyVenuesPage").then((module) => ({
    default: module.MyVenuesPage,
  })),
);

function VenueListPage() {
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("priceAsc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [amenityFilters, setAmenityFilters] = useState<AmenityKey[]>([]);
  const debouncedQuery = useDebounce(searchValue, 400);

  const updateSearch = useCallback((value: string) => {
    setSearchValue(value);
    setAmenityFilters([]);
  }, []);

  const handleAmenityClick = useCallback((amenity: AmenityKey) => {
    setSearchValue("");
    setAmenityFilters((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity],
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto mb-8 flex max-w-4xl flex-col items-center text-center">
        <h1 className="home-hero-title m-0 text-black">
          Find your perfect stay
        </h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base">
          Discover unique accommodations around the world. From cozy cabins to
          luxury villas.
        </p>

        <div className="mt-5 flex w-full flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
          <SearchInput value={searchValue} onChange={updateSearch} />
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortMenuOpen((prev) => !prev)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSortMenuOpen(false);
                }
              }}
              className={`${buttonClasses("primary", "sm")} gap-2 min-h-0! px-[1em]! py-[0.7em]! text-base leading-4.75!`}
              aria-haspopup="menu"
              aria-expanded={sortMenuOpen}
              aria-controls="sort-menu"
            >
              {SORT_LABEL_MAP[sortBy]}
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-3.5 w-3.5"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  d="M5 7.5 10 12.5l5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {sortMenuOpen && (
              <div
                id="sort-menu"
                role="menu"
                aria-label="Sort venues"
                className="absolute right-0 z-20 mt-2 min-w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
              >
                {(
                  [
                    ["priceAsc", "Price Low-High"],
                    ["priceDesc", "Price High-Low"],
                    ["recent", "Newest"],
                  ] as Array<[SortOption, string]>
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="menuitem"
                    aria-current={sortBy === value ? "true" : undefined}
                    onClick={() => {
                      setSortBy(value);
                      setSortMenuOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${sortBy === value ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {amenityFilters.length > 0 && (
          <div className="mt-3 w-full max-w-xl">
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2">
              <span className="text-xs text-gray-500">Active tags</span>
              {amenityFilters.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleAmenityClick(amenity)}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  {AMENITY_LABELS[amenity]}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmenityFilters([])}
                className="text-xs font-medium text-gray-600 underline"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      <VenueGrid
        query={
          amenityFilters.length > 0 ? undefined : debouncedQuery || undefined
        }
        sortBy={sortBy}
        amenityFilters={amenityFilters}
        onAmenityClick={handleAmenityClick}
      />
    </main>
  );
}

function App() {
  const [signedIn, setSignedIn] = useState<boolean>(() => isAuthenticated());
  const [profileName, setProfileName] = useState<string>(() => {
    return getStoredProfile()?.name ?? "";
  });
  const [isVenueManager, setIsVenueManager] = useState<boolean>(() => {
    return getStoredProfile()?.venueManager ?? false;
  });

  const handleLogout = () => {
    clearAuth();
    setSignedIn(false);
    setProfileName("");
    setIsVenueManager(false);
  };

  const handleLoginSuccess = () => {
    const profile = getStoredProfile();
    setSignedIn(true);
    setProfileName(profile?.name ?? "");
    setIsVenueManager(profile?.venueManager ?? false);
  };

  return (
    <BrowserRouter>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-gray-900 focus:shadow"
      >
        Skip to main content
      </a>
      <div
        className="flex min-h-screen flex-col"
        style={{ backgroundColor: "#EFEFEF" }}
      >
        <Navbar
          signedIn={signedIn}
          profileName={profileName}
          isVenueManager={isVenueManager}
          onLogout={handleLogout}
        />

        <div id="main-content" className="flex-1">
          <Suspense
            fallback={
              <div className="w-full px-4 py-10 sm:px-6 lg:px-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 w-56 rounded bg-gray-200" />
                  <div className="h-56 rounded-2xl bg-gray-200" />
                  <div className="h-40 rounded-2xl bg-gray-200" />
                </div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<VenueListPage />} />
              <Route path="/venues/:id" element={<VenueDetailPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/login"
                element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
              />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-venues" element={<MyVenuesPage />} />
              <Route path="/venues/create" element={<CreateVenuePage />} />
              <Route path="/venues/:id/edit" element={<EditVenuePage />} />
            </Routes>
          </Suspense>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
