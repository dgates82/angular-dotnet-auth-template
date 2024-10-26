import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { LoggerService } from '@core/services/logger.service';
import { UserService } from '@data/services/user.service';
import { faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { IApplicationUser } from '@interfaces/account/application-user';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly userService: UserService,
              private readonly route: ActivatedRoute) { }

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
