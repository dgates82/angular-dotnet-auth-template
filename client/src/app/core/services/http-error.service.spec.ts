import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { HttpErrorService } from './http-error.service';
import { LoggerService } from './logger.service';

describe('HttpErrorService', () => {
  let service: HttpErrorService;
  let logger: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    logger = { error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        HttpErrorService,
        { provide: LoggerService, useValue: logger },
      ]
    });

    service = TestBed.inject(HttpErrorService);
  });

  it('logs the error and rethrows it as an observable error', async () => {
    const httpError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });

    await expect(firstValueFrom(service.handleError(httpError))).rejects.toBe(httpError);
    expect(logger.error).toHaveBeenCalledTimes(2);
  });
});
