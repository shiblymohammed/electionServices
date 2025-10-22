import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginResponse } from '../types/auth';
import api from '../services/api';

interface AuthContextType extends AuthState {
  login: (phone: string, firebaseToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'election_cart_token';
const USER_KEY = 'election_cart_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid by fetching user profile
          try {
            await refreshUser();
          } catch (error) {
            // Token is invalid, clear auth state
            logout();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (phone: string, firebaseToken: string) => {
    try {
      const response = await api.post<LoginResponse>('/auth/verify-phone/', {
        phone,
        firebase_token: firebaseToken,
      });

      const { token: jwtToken, user: userData } = response.data;

      // Store token and user in localStorage
      localStorage.setItem(TOKEN_KEY, jwtToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));

      // Update state
      setToken(jwtToken);
      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(
        error.response?.data?.error?.message || 'Login failed. Please try again.'
      );
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Clear state
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get<User>('/auth/me/');
      const userData = response.data;

      // Update user in localStorage and state
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};
