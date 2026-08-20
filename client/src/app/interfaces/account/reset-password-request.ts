export interface IResetPasswordRequest {
  userId: string;
  code: string;
  password: string;
}
