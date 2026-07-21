export interface IJWTPayload {
  id: string;
  info: string; // Can be email or phone number
  isAdmin?: boolean;
  exp?: number;
  iat?: number;
}
