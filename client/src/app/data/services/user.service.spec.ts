import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LocationStrategy } from '@angular/common';

import { UserService } from './user.service';
import { LoggerService } from '@core/services/logger.service';
import { HttpErrorService } from '@core/services/http-error.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        HttpErrorService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LocationStrategy, useValue: { getBaseHref: () => '/' } },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetches the user list', async () => {
    const users = [{ id: '1', email: 'admin@example.com' }];
    const promise = service.get();

    const req = httpMock.expectOne('/api/admin/user');
    expect(req.request.method).toBe('GET');
    req.flush(users);

    await expect(promise).resolves.toEqual(users);
  });

  it('fetches a single user by id', async () => {
    const user = { id: '42', email: 'someone@example.com' };
    const promise = service.getById('42');

    const req = httpMock.expectOne('/api/admin/user/get?id=42');
    expect(req.request.method).toBe('GET');
    req.flush(user);

    await expect(promise).resolves.toEqual(user);
  });

  it('creates a user via POST', async () => {
    const newUser = { email: 'created@example.com' } as any;
    const promise = service.createUser(newUser);

    const req = httpMock.expectOne('/api/admin/user');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush(newUser);

    await expect(promise).resolves.toEqual(newUser);
  });
});
