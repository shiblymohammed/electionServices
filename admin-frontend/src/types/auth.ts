export interface User {
  id: number;
  phone: string;
  role: 'user' | 'staff' | 'admin';
  name?: string;
  firebase_uid: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
  role: string;
}
