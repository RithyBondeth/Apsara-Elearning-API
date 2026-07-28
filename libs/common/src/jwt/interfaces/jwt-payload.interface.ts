export interface IJWTPayload {
  id: string;
  info: string; // Can be email or phone number
  type: 'access';
  isAdmin?: boolean;
  exp?: number;
  iat?: number;
}

export interface IRefreshTokenPayload {
  id: string;
  type: 'refresh';
  exp?: number;
  iat?: number;
}

export interface IActionTokenPayload {
  email: string;
  type: 'email-verification' | 'password-reset';
  exp?: number;
  iat?: number;
}
