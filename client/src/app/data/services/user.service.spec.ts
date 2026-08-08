import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LocationStrategy } from '@angular/common';

import { UserService } from './user.service';
import { LoggerService } from '@core/services/logger.service';
import { HttpErrorService } from '@core/services/http-error.service';
import { IApplicationUser } from '@interfaces/account/application-user';

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

    const req = httpMock.expectOne('/api/auth/listusers?page=1&pageSize=1000');
    expect(req.request.method).toBe('GET');
    req.flush({ items: users, totalCount: 1, page: 1, pageSize: 1000 });

    await expect(promise).resolves.toEqual(users);
  });

  it('pages through the full result set when more users remain', async () => {
    const firstPage = [{ id: '1', email: 'admin@example.com' }];
    const secondPage = [{ id: '2', email: 'someone@example.com' }];
    const promise = service.get();

    const firstReq = httpMock.expectOne('/api/auth/listusers?page=1&pageSize=1000');
    firstReq.flush({ items: firstPage, totalCount: 2, page: 1, pageSize: 1 });
    await Promise.resolve();
    await Promise.resolve();

    const secondReq = httpMock.expectOne('/api/auth/listusers?page=2&pageSize=1');
    secondReq.flush({ items: secondPage, totalCount: 2, page: 2, pageSize: 1 });

    await expect(promise).resolves.toEqual([...firstPage, ...secondPage]);
  });

  it('fetches a single user by id', async () => {
    const user = { id: '42', email: 'someone@example.com' };
    const promise = service.getById('42');

    const req = httpMock.expectOne('/api/auth/getuserbyid/42');
    expect(req.request.method).toBe('GET');
    req.flush(user);

    await expect(promise).resolves.toEqual(user);
  });

  it('creates a user via POST with just email/roles when no profile fields are set', async () => {
    const newUser = { email: 'created@example.com', roles: ['User'] } as IApplicationUser;
    const created = { id: '99', email: 'created@example.com', roles: ['User'] };
    const promise = service.createUser(newUser);

    const req = httpMock.expectOne('/api/auth/admincreateuser');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: newUser.email, roles: newUser.roles });
    req.flush(created);

    await expect(promise).resolves.toEqual(created);
  });

  it('creates a user then updates profile fields when any are set', async () => {
    const newUser = { email: 'created@example.com', firstName: 'Jane' } as IApplicationUser;
    const created = { id: '99', email: 'created@example.com' };
    const updated = { id: '99', email: 'created@example.com', firstName: 'Jane' };
    const promise = service.createUser(newUser);

    const createReq = httpMock.expectOne('/api/auth/admincreateuser');
    createReq.flush(created);
    await Promise.resolve();
    await Promise.resolve();

    const updateReq = httpMock.expectOne('/api/admin/user');
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body).toEqual({ ...newUser, id: created.id });
    updateReq.flush(updated);

    await expect(promise).resolves.toEqual(updated);
  });
});
