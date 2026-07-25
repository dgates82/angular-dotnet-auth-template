import { IAuthResponse } from '@interfaces/account/auth-response';

const AUTH_RESPONSE_KEY = 'authResponse';

// Plain function rather than an injectable service: tokenGetter() is invoked by
// @auth0/angular-jwt's JwtModule.forRoot config outside Angular's injection
// context, so it can't take a constructor-injected dependency.
export function readAuthResponse(): IAuthResponse | null {
  const response = localStorage.getItem(AUTH_RESPONSE_KEY);
  if (!response) {
    return null;
  }

  return JSON.parse(response) as IAuthResponse;
}

export function writeAuthResponse(authResponse: IAuthResponse): void {
  localStorage.setItem(AUTH_RESPONSE_KEY, JSON.stringify(authResponse));
}
