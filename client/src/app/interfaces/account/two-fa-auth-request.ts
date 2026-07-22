export interface ITwoFaAuthRequest {
  email: string,
  twoFactorProvider: string,
  twoFactorCode: string
}
