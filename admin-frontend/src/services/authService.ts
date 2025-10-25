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
}

export default new AuthService();
