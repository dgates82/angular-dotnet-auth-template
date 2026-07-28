import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

import { errorInterceptor, SKIP_ERROR_DIALOG } from './error.interceptor';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let swalFireSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    swalFireSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({} as never);
  });

  afterEach(() => {
    httpMock.verify();
    swalFireSpy.mockRestore();
  });

  it('shows a generic error dialog when a request fails', async () => {
    const promise = firstValueFrom(httpClient.get('/api/whatever')).catch(() => undefined);

    httpMock.expectOne('/api/whatever').flush(null, { status: 500, statusText: 'Server Error' });
    await promise;

    expect(swalFireSpy).toHaveBeenCalledTimes(1);
  });

  it('does not show a dialog when the request opts out via SKIP_ERROR_DIALOG', async () => {
    const context = new HttpContext().set(SKIP_ERROR_DIALOG, true);
    const promise = firstValueFrom(httpClient.get('/api/whatever', { context })).catch(() => undefined);

    httpMock.expectOne('/api/whatever').flush(null, { status: 500, statusText: 'Server Error' });
    await promise;

    expect(swalFireSpy).not.toHaveBeenCalled();
  });

  it('rethrows the original error so callers can still handle it', async () => {
    const promise = firstValueFrom(httpClient.get('/api/whatever'));

    httpMock.expectOne('/api/whatever').flush(null, { status: 404, statusText: 'Not Found' });

    await expect(promise).rejects.toMatchObject({ status: 404 });
  });
});
