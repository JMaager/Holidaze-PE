/** Shape returned by Noroff API error responses */
export interface NoroffApiError {
  code?: string;
  message: string;
  path?: string[];
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errors: NoroffApiError[];

  constructor(status: number, message: string, errors: NoroffApiError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Reads a failed Response and throws an ApiError with the Noroff error body.
 * Noroff error shape: { errors: [{ code?, message, path? }], status, statusCode }
 */
export async function throwApiError(response: Response): Promise<never> {
  let message = `Request failed with status ${response.status}`;
  let errors: NoroffApiError[] = [];

  try {
    const body = await response.json();
    if (Array.isArray(body?.errors) && body.errors.length > 0) {
      errors = body.errors;
      message = body.errors[0].message ?? message;
    }
  } catch {
    // Body was not JSON — keep the default message
  }

  throw new ApiError(response.status, message, errors);
}
