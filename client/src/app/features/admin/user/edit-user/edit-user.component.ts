import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { LoggerService } from '@core/services/logger.service';
import { UserService } from '@data/services/user.service';
import { faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { IApplicationUser } from '@interfaces/account/application-user';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AdminPersonalInfoComponent } from '../admin-personal-info/admin-personal-info.component';
import { AdminSecurityInfoComponent } from '../admin-security-info/admin-security-info.component';

@Component({
    selector: 'app-edit-user',
    templateUrl: './edit-user.component.html',
    styleUrls: ['./edit-user.component.scss'],
    imports: [MatTabGroup, MatTab, MatTabLabel, FaIconComponent, AdminPersonalInfoComponent, AdminSecurityInfoComponent]
})
export class EditUserComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);


  user!: IApplicationUser;

  icons = {
    personal: faUser,
    security: faLock
  }

  ngOnInit(): void {
    this.logger.debug(`edit-user.component.ngOnInit`)

    // Get the id from the route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.logger.debug(`edit-user.component.ngOnInit: id: ${id}`)

      if (id) {
        this.userService.getById(id).then(user => {
          this.logger.trace(`edit-user.component.ngOnInit: user:`, user)
          this.user = user;
        });
      }
    });

  }

}
