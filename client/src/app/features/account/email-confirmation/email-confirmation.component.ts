import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LoggerService } from '@core/services/logger.service';
import { AccountService } from '@data/services/account.service';
import { IConfirmEmailRequest } from '@interfaces/account/confirm-email-request';
import { MatCard, MatCardContent, MatCardTitle, MatCardSubtitle } from '@angular/material/card';

@Component({
    selector: 'app-email-confirmation',
    templateUrl: './email-confirmation.component.html',
    styleUrls: ['./email-confirmation.component.scss'],
    imports: [MatCard, MatCardContent, MatCardTitle, MatCardSubtitle, RouterLink]
})
export class EmailConfirmationComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly accountService: AccountService,
              private readonly router: Router,
              private readonly route: ActivatedRoute) { }

  isConfirmed: boolean = false;
  emailAddress: string = '';

  ngOnInit(): void {
    this.logger.debug(`email-confirmation.component.ngOnInit`);

    this.route.queryParams.subscribe(params => {
      const userId = params['userId'];
      const emailCode = params['emailCode'];
      const isFirstLogin = params['isFirstLogin']
      this.emailAddress = params['emailAddress'];

      this.logger.trace(`email-confirmation.component.ngOnInit | emailCode: ${emailCode} | isFirstLogin: ${isFirstLogin}`);

      const emailConfirmationRequest: IConfirmEmailRequest = {
        userId: userId,
        code: emailCode
      }

      this.accountService.confirmEmail(emailConfirmationRequest).then(response => {
        this.logger.trace(`email-confirmation.component.ngOnInit | response:`, response);

        // If this is the user's first login, route to password reset
        // first login is only set if an admin created the user with a random password
        if (isFirstLogin) {
          // Include password reset token in query params
          this.router.navigate(['/email-confirmation/reset'], { queryParamsHandling: 'preserve' });
        }
        else {
          // HACK: There is no current use case for this
          this.isConfirmed = true;
        }

      });
    });

  }

}
