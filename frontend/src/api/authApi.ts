import { ApiError, request } from "./http";
import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  User,
} from "../types/auth";

export const register = (body: RegisterRequest) =>
  request<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const verifyEmail = (token: string) =>
  request<void>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

export const resendVerification = (email: string) =>
  request<void>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export async function login(body: LoginRequest): Promise<User> {
  try {
    return await request<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new Error("Invalid email or password.", { cause: error });
    }
    throw error;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await request<User>("/api/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export const logout = () =>
  request<void>("/api/auth/logout", { method: "POST" });
