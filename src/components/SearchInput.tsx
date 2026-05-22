import { Input } from "./ui/Input";
import { buttonClasses } from "./ui/buttonClasses";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search venues by name or description…",
}: SearchInputProps) {
  return (
    <div className="relative w-full max-w-xl">
      {/* Search icon */}
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </span>

      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl min-h-0! px-0! py-[0.7em]! pl-[2.5em]! text-base leading-[0.5em] bg-[#D9D9D9]! text-gray-800! placeholder:text-gray-700! sm:text-sm"
        aria-label="Search venues"
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-2 ${buttonClasses("secondary", "sm")}`}
          aria-label="Clear search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
