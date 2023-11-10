export interface IVerifyAuthenticatorResponse {
  isVerified: boolean;
  message: string;
  codes: string[];
}
