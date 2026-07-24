import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';

import { DataTableDirective, DataTablesModule } from 'angular-datatables';
import { Api } from 'datatables.net';

import { LoggerService } from '@core/services/logger.service';
import { UserService } from '@data/services/user.service';
import { IApplicationUser } from '@interfaces/account/application-user';
import { Subject } from 'rxjs';

import { faUserEdit, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatButton, MatMiniFabButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
    selector: 'app-list-users',
    templateUrl: './list-users.component.html',
    styleUrls: ['./list-users.component.scss'],
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatButton, FaIconComponent, MatSlideToggle, DataTablesModule, MatMiniFabButton]
})
export class ListUsersComponent implements OnInit {

  constructor(private readonly logger: LoggerService,
              private readonly userService: UserService,
              private readonly router: Router,
              private readonly cdr: ChangeDetectorRef) { }

  @ViewChild(DataTableDirective) dtElement!: DataTableDirective;
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();

  users!: IApplicationUser[];

  includeInactiveUsers: boolean = false;

  private dtInitialized: boolean = false;

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
          orderable: false // HACK: Why isn't this working?
        }
      ]
    }

    this.reloadData();

  }

  reloadData(): void {
    this.userService.get().then(response => {
      this.logger.trace(`list-users.component.ngOnInit | response:`, response)

      if (!this.includeInactiveUsers) {
        response = response.filter(x => x.isActive);
      }

      this.users = response;
      // Flush *ngFor's row update into the live DOM before touching
      // DataTables - it reads <tbody> synchronously on (re)init, and
      // relying on zone.js timing to flush it first isn't reliable.
      this.cdr.detectChanges();
      this.initializeDataTable();
    });
  }

  initializeDataTable(): void {
    this.logger.debug(`list-users.component.initializeDataTable`);

    // First render: the table has real rows from *ngFor already, so just
    // trigger DataTables once. Re-triggering an empty table and destroying
    // it afterwards isn't reliable across datatables.net versions, so avoid
    // that path entirely rather than depend on its timing.
    if (!this.dtInitialized) {
      this.dtInitialized = true;
      this.dtTrigger.next(this.dtOptions);
      return;
    }

    this.dtElement.dtInstance.then((dtInstance: Api) => {
      dtInstance.destroy();
      this.dtTrigger.next(this.dtOptions);
    });
  }

  ngOnDestroy() {
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
