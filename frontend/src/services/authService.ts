import api from './api';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    phone_number: string;
    role: 'user' | 'staff' | 'admin';
  };
  role: string;
}

interface SignupResponse extends LoginResponse {
  message: string;
}

class AuthService {
  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login/', {
        username,
        password,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error logging in:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  /**
   * Sign up new user
   */
  async signup(
    username: string,
    password: string,
    phoneNumber?: string
  ): Promise<SignupResponse> {
    try {
      const response = await api.post<SignupResponse>('/auth/signup/', {
        username,
        password,
        phone_number: phoneNumber || '',
      });
      return response.data;
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  }
}

export default new AuthService();
