export interface ISendVerificationCodeRequest {
  email: string;
  phoneNumber?: string;
  method: string;
}
