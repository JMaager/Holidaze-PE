import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buttonClasses } from "./buttonClasses";

interface NavbarProps {
  signedIn: boolean;
  profileName: string;
  isVenueManager: boolean;
  onLogout: () => void;
}

export function Navbar({
  signedIn,
  profileName,
  isVenueManager,
  onLogout,
}: NavbarProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    setMenuOpen(false);
    navigate("/", { replace: true });
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40">
      <div className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen border-b border-gray-200 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80">
        <div className="mx-auto flex w-full max-w-281.5 items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <Link to="/" className="inline-block" onClick={closeMenu}>
            <h1 className="navbar-logo m-0 block text-3xl/[0.72] font-bold text-black">
              Holidaze
            </h1>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden md:flex md:flex-1 md:items-center md:justify-center"
          >
            <ul className="flex items-center gap-5">
              <li>
                <Link
                  to="/"
                  className="text-[11px] font-medium text-black underline-offset-4 transition-colors hover:underline"
                >
                  Browse Venues
                </Link>
              </li>
              {signedIn && (
                <li>
                  <Link
                    to="/my-venues"
                    className="text-[11px] font-medium text-black underline-offset-4 transition-colors hover:underline"
                  >
                    My Venues
                  </Link>
                </li>
              )}
              {signedIn && isVenueManager && (
                <>
                  <li>
                    <Link
                      to="/venues/create"
                      className="text-[11px] font-medium text-black underline-offset-4 transition-colors hover:underline"
                    >
                      Create Venue
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/profile"
                      className="text-[11px] font-medium text-black underline-offset-4 transition-colors hover:underline"
                    >
                      Profile
                    </Link>
                  </li>
                </>
              )}
              {signedIn && !isVenueManager && (
                <li>
                  <Link
                    to="/profile"
                    className="text-[11px] font-medium text-black underline-offset-4 transition-colors hover:underline"
                  >
                    Profile
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div className="hidden md:flex md:items-center md:gap-2">
            {signedIn ? (
              <>
                {profileName && (
                  <span className="max-w-36 truncate text-xs text-gray-700 sm:max-w-44">
                    Hi, {profileName}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className={`${buttonClasses("secondary", "sm")} min-h-8 px-2.5 py-1.5 text-xs`}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`${buttonClasses("primary", "sm")} min-h-0! px-[1em]! py-[0.5em]! text-[11px] leading-none`}
              >
                <span
                  aria-hidden="true"
                  className="mr-2 inline-flex items-center"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-3.5 w-3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c1.5-3.5 4.7-5 8-5s6.5 1.5 8 5" />
                  </svg>
                </span>
                Log in
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            aria-controls="mobile-menu-panel"
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-gray-400 text-gray-800 md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
            >
              {menuOpen ? (
                <path d="m6 6 12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav
            id="mobile-menu-panel"
            aria-label="Mobile"
            className="border-t border-gray-200"
          >
            <div className="mx-auto w-full max-w-281.5 px-4 py-2.5 sm:px-6 md:hidden">
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    to="/"
                    onClick={closeMenu}
                    className={buttonClasses("secondary", "sm")}
                  >
                    Browse Venues
                  </Link>
                </li>
                {signedIn ? (
                  <>
                    <li>
                      <Link
                        to="/my-venues"
                        onClick={closeMenu}
                        className={buttonClasses("secondary", "sm")}
                      >
                        My Venues
                      </Link>
                    </li>
                    {isVenueManager && (
                      <li>
                        <Link
                          to="/venues/create"
                          onClick={closeMenu}
                          className={buttonClasses("secondary", "sm")}
                        >
                          Create Venue
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link
                        to="/profile"
                        onClick={closeMenu}
                        className={buttonClasses("secondary", "sm")}
                      >
                        Profile
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className={buttonClasses("danger", "sm")}
                      >
                        Log out
                      </button>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className={`${buttonClasses("primary", "sm")} min-h-0! px-[1em]! py-[0.5em]! text-[11px] leading-none`}
                    >
                      <span
                        aria-hidden="true"
                        className="mr-2 inline-flex items-center"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-4 w-4"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 20c1.5-3.5 4.7-5 8-5s6.5 1.5 8 5" />
                        </svg>
                      </span>
                      Log in
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
