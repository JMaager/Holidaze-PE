import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { isApiError, type ApiError } from "../api/errors";
import { setStoredProfile, setToken } from "../api/auth";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

interface LoginFormState {
  email: string;
  password: string;
}

interface LoginFieldErrors {
  email?: string;
  password?: string;
}

function formatLoginError(error: ApiError): string {
  if (error.errors.length > 0) {
    return error.errors.map((item) => item.message).join(" ");
  }
  return error.message;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  const updateField = <K extends keyof LoginFormState>(
    key: K,
    value: LoginFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateForm = (): LoginFieldErrors => {
    const errors: LoginFieldErrors = {};

    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      errors.password = "Password is required.";
    }

    return errors;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError("Please fix the highlighted fields.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setToken(response.data.accessToken);

      setStoredProfile({
        name: response.data.name,
        email: response.data.email,
        venueManager: response.data.venueManager,
        avatar: response.data.avatar,
        banner: response.data.banner,
      });

      onLoginSuccess?.();
      navigate("/", { replace: true });
    } catch (err: unknown) {
      setError(
        isApiError(err)
          ? `Server error: ${formatLoginError(err)}`
          : "Login failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8 text-left sm:px-6 sm:py-10">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Welcome Back
          </h2>
          <p className="mt-1 font-(--heading) text-sm text-gray-500">
            Log in to manage your account.
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

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </span>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              autoComplete="email"
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
              autoComplete="current-password"
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

          <Button type="submit" disabled={submitting} className="mb-3 w-full">
            {submitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="text-center font-(--heading) text-sm text-gray-600">
          Need an account?{" "}
          <Link to="/register" className="font-medium text-gray-900 underline">
            Register here
          </Link>
        </p>
      </section>
    </main>
  );
}
