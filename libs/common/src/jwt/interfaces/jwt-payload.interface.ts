export interface IJWTPayload {
  id: string;
  info: string; // Can be email or phone number
  exp?: number;
  iat?: number;
}
