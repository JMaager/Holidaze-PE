import { type ApiError } from "../api/errors";

export function formatApiError(error: ApiError): string {
  if (error.errors.length > 0) {
    return error.errors.map((item) => item.message).join(" ");
  }
  return error.message;
}
