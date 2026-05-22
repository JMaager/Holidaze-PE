import { apiPost } from "./client";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  venueManager: boolean;
}

export interface RegisterResponse {
  data: {
    name: string;
    email: string;
    venueManager: boolean;
  };
  meta: Record<string, never>;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    name: string;
    email: string;
    avatar?: { url: string; alt: string };
    banner?: { url: string; alt: string };
    accessToken: string;
    venueManager: boolean;
  };
  meta: Record<string, never>;
}

export function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  return apiPost<RegisterResponse>("/auth/register", payload);
}

export function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/auth/login", payload, {
    params: { _holidaze: true },
  });
}
