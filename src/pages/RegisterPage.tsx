import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";
import { isApiError, type ApiError } from "../api/errors";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  venueManager: boolean;
}

interface RegisterFieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function isStudEmail(email: string): boolean {
  return /@stud\.noroff\.no$/i.test(email.trim());
}

function formatRegistrationError(error: ApiError): string {
  if (error.errors.length > 0) {
    return error.errors.map((item) => item.message).join(" ");
  }
  return error.message;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    venueManager: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key !== "venueManager") {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validateForm = (): RegisterFieldErrors => {
    const errors: RegisterFieldErrors = {};

    if (!form.name.trim()) {
      errors.name = "Username is required.";
    } else if (form.name.trim().length < 2) {
      errors.name = "Username must be at least 2 characters.";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!isStudEmail(form.email)) {
      errors.email = "Email must end with @stud.noroff.no.";
    }

    if (!form.password) {
      errors.password = "Password is required.";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    return errors;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError("Please fix the highlighted fields.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await registerUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        venueManager: form.venueManager,
      });

      setSuccess(
        `Account created for ${response.data.email}. You can now log in.`,
      );
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        venueManager: false,
      });
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      setError(
        isApiError(err)
          ? `Server error: ${formatRegistrationError(err)}`
          : "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8 text-left sm:px-6 sm:py-10">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 sm:mb-6">
          <h2 className="font-(--heading) text-xl text-gray-900 sm:text-2xl">
            Create Account
          </h2>
          <p className="mt-1 font-(--heading) text-sm text-gray-500">
            Use your student email to register.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              role="status"
              aria-live="polite"
            >
              {success}
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Username
            </span>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              autoComplete="name"
              placeholder="your_username"
              className="min-h-0! py-[0.7em]! text-base leading-[0.5em] bg-[#D9D9D9]! text-[#555555]! placeholder:text-[#555555]!"
              aria-invalid={Boolean(fieldErrors.name)}
              required
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Student Email
            </span>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              autoComplete="email"
              placeholder="name@stud.noroff.no"
              pattern=".+@stud\.noroff\.no"
              className="min-h-0! py-[0.7em]! text-base leading-[0.5em] bg-[#D9D9D9]! text-[#555555]! placeholder:text-[#555555]!"
              aria-invalid={Boolean(fieldErrors.email)}
              required
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </span>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              className="min-h-0! py-[0.7em]! text-base leading-[0.5em] bg-[#D9D9D9]! text-[#555555]! placeholder:text-[#555555]!"
              aria-invalid={Boolean(fieldErrors.password)}
              required
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Confirm Password
            </span>
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              className="min-h-0! py-[0.7em]! text-base leading-[0.5em] bg-[#D9D9D9]! text-[#555555]! placeholder:text-[#555555]!"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.venueManager}
              onChange={(e) => updateField("venueManager", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-300"
            />
            Register as a venue manager
          </label>

          <Button type="submit" disabled={submitting} className="mb-3 w-full">
            {submitting ? "Creating account..." : "Register"}
          </Button>
        </form>

        <p className="text-center font-(--heading) text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-gray-900 underline">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
