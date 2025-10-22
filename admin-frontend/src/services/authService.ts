import api from './api';
import { User, LoginResponse } from '../types/auth';

export const verifyPhone = async (phone: string, firebaseToken: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/verify-phone/', {
    phone,
    firebase_token: firebaseToken,
  });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me/');
  return response.data;
};
