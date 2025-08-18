import api from './axios';
import type { LoginResponse, SessionResponse } from '../auth/types';

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', { username, password });
  return data;
}

export async function getSession(): Promise<SessionResponse> {
  const { data } = await api.get<SessionResponse>('/api/auth/session');
  return data;
}