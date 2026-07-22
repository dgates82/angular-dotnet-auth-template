export interface IChangePasswordRequest {
  email: string;
  currentPassword: string;
  newPassword: string;
}
