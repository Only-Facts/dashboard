export interface User {
  id: number;
  email: string;
  username: string;
  emailVerified: boolean;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type RegisterResponse = User;

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (request: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
