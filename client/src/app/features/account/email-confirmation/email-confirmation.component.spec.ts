import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { EmailConfirmationComponent } from './email-confirmation.component';
import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';

describe('EmailConfirmationComponent', () => {
  let accountService: { confirmEmail: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  function configure(queryParams: Record<string, string>) {
    accountService = { confirmEmail: vi.fn().mockResolvedValue({ isSuccess: true }) };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [EmailConfirmationComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { queryParams: of(queryParams) } },
        { provide: LoggerService, useValue: { trace: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } },
      ]
    });
  }

  it('confirms the email using the userId/emailCode query params', async () => {
    configure({ userId: '1', emailCode: 'abc123' });

    const fixture = TestBed.createComponent(EmailConfirmationComponent);
    fixture.detectChanges();
    await Promise.resolve();

    expect(accountService.confirmEmail).toHaveBeenCalledWith({ userId: '1', code: 'abc123' });
  });

  it('marks the confirmation complete when this is not a first login', async () => {
    configure({ userId: '1', emailCode: 'abc123' });

    const fixture = TestBed.createComponent(EmailConfirmationComponent);
    fixture.detectChanges();
    await Promise.resolve();

    expect(fixture.componentInstance.isConfirmed).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('navigates to the password-reset step, preserving query params, on a first login', async () => {
    configure({ userId: '1', emailCode: 'abc123', isFirstLogin: 'true' });

    const fixture = TestBed.createComponent(EmailConfirmationComponent);
    fixture.detectChanges();
    await Promise.resolve();

    expect(router.navigate).toHaveBeenCalledWith(['/email-confirmation/reset'], { queryParamsHandling: 'preserve' });
    expect(fixture.componentInstance.isConfirmed).toBe(false);
  });
});
