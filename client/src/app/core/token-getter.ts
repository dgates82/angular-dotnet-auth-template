import { readAuthResponse } from '@core/auth-storage';

export function tokenGetter() {
  return readAuthResponse()?.token ?? '';
}
