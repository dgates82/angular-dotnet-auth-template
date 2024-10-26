import { IApplicationUser } from '@interfaces/account/application-user';

export interface IAuthResponse {
  isAuthSuccessful: boolean,
  errorMessage?: string,
  token?: string,
  requiresTwoFactor: boolean,
  user: IApplicationUser
}
