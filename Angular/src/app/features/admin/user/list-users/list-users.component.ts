import { Component, OnInit, ViewChild } from '@angular/core';

import { DataTableDirective } from 'angular-datatables';

import { LoggerService } from '@core/services/logger.service';
import { UserService } from '@data/services/user.service';
import { IApplicationUser } from '@interfaces/account/application-user';
import { Subject } from 'rxjs';

import { faUserEdit, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.scss']
})
export class ListUsersComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
    private readonly userService: UserService,
    private readonly router: Router) { }

  @ViewChild(DataTableDirective) dtElement!: DataTableDirective;
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  users!: IApplicationUser[];

  includeInactiveUsers: boolean = false;

  icons = {
    edit: faUserEdit,
    userAdd: faUserPlus
  }

  ngOnInit(): void {
    this.logger.debug(`list-users.component.ngOnInit`)

    this.dtOptions = {
      pageLength: 10,
      lengthChange: false,
      columnDefs: [
        {
          targets: 3,
          orderable: false // TODO: Why isn't this working?
        }
      ]
      //dom: 'Bfrtip',
      //buttons: [
      //  'csv', 'excel', {          
      //    text: $('#faUserAdd').html(),
      //    className: 'mat-button fa fa-user-plus',
      //    action: () => {
      //      this.onAddUser();
      //    }
      //  }
      //]
    }

    this.reloadData();
    
  }

  reloadData(): void {
    this.userService.get().then(response => {
      this.logger.trace(`list-users.component.ngOnInit | response: ${JSON.stringify(response)}`)

      if (!this.includeInactiveUsers) {
        response = response.filter(x => x.isActive);
      }

      this.users = response;
      this.initializeDataTable();
    });
  }

  initializeDataTable(): void {
    this.logger.debug(`list-users.component.initializeDataTable`);
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next();
    });
  }

  ngAfterViewInit() {
    this.dtTrigger.next();
  }

  ngOnDestry() {
    this.dtTrigger.unsubscribe();
  }

  onAddUser(): void {
    this.logger.debug(`list-users.component.onAddUser`);
    this.router.navigate(['/admin/register-user']);
  }

  onDetails(userId: string): void {
    this.logger.debug(`list-users.component.onDetails | userId: ${userId}`)
    this.router.navigate(['/admin/edit-user', userId]);
  }

  onIncludeInactiveUsersChanged(event: any): void {
    this.logger.debug(`list-users.component.onIncludeInatciveUsersChanged | event: ${event.checked}`)
    this.includeInactiveUsers = event.checked;
    this.reloadData();
  }

}
