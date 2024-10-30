export interface IVerifyAuthenticatorRequest {
  email: string;
  phoneNumber?: string;
  method: string;
  code: string;
}
