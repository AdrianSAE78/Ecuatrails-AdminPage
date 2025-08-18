export type Role = 'ROLE_ADMIN' | 'ROLE_USER' | string;

export interface LoginResponse {
  token: string;
  user: {
    id: number | string;
    username: string;
    roles: Role[];
  };
}

export interface SessionResponse {
  user: {
    id: number | string;
    username: string;
    roles: Role[];
  };
}