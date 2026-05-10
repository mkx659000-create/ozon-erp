import request from '../request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  nickname: string;
}

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  nickname: string;
  role: string;
  status: string;
}

export function loginApi(data: LoginParams): Promise<TokenResult> {
  return request.post('/auth/login', data);
}

export function registerApi(data: RegisterParams): Promise<TokenResult> {
  return request.post('/auth/register', data);
}

export function getProfileApi(): Promise<UserInfo> {
  return request.get('/auth/profile');
}

export function refreshTokenApi(): Promise<TokenResult> {
  return request.post('/auth/refresh');
}
