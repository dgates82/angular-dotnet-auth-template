import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { LoggerService } from '@core/services/logger.service';
import { UserService } from '@data/services/user.service';
import { IApplicationUser } from '@interfaces/account/application-user';

import Swal from 'sweetalert2';
import { faUserEdit, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatButton, MatMiniFabButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
    selector: 'app-list-users',
    templateUrl: './list-users.component.html',
    styleUrls: ['./list-users.component.scss'],
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatButton, FaIconComponent, MatSlideToggle, MatMiniFabButton, MatTableModule, MatSortModule, MatPaginatorModule, MatFormField, MatLabel, MatInput]
})
export class ListUsersComponent implements OnInit, AfterViewInit {
  private readonly logger = inject(LoggerService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);


  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['email', 'firstName', 'lastName', 'status', 'actions'];
  dataSource = new MatTableDataSource<IApplicationUser>([]);

  includeInactiveUsers = false;

  icons = {
    edit: faUserEdit,
    userAdd: faUserPlus
  }

  ngOnInit(): void {
    this.logger.debug(`list-users.component.ngOnInit`)

    this.dataSource.filterPredicate = (user: IApplicationUser, filter: string) => {
      const haystack = `${user.email} ${user.firstName} ${user.lastName} ${user.isActive ? 'Active' : 'Inactive'}`.toLowerCase();
      return haystack.includes(filter);
    };

    // MatTableDataSource's default sortingDataAccessor reads properties by
    // column name (e.g. user['status']), which doesn't exist on
    // IApplicationUser - the underlying field is isActive. Map the display
    // columns that aren't a direct property match; fall back to the raw
    // property for the rest.
    this.dataSource.sortingDataAccessor = (user: IApplicationUser, columnName: string) => {
      switch (columnName) {
        case 'status':
          return user.isActive ? 1 : 0;
        default:
          return (user as unknown as Record<string, string | number>)[columnName] ?? '';
      }
    };

    this.reloadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  reloadData(): void {
    this.userService.get().then(response => {
      this.logger.trace(`list-users.component.ngOnInit | response:`, response)

      if (!this.includeInactiveUsers) {
        response = response.filter(x => x.isActive);
      }

      this.dataSource.data = response;
    }).catch(err => {
      this.logger.error(`list-users.component.reloadData | Failed to load users:`, err);
      Swal.fire({
        title: 'Error',
        text: 'The user list could not be loaded. Please try again.',
        icon: 'error',
        heightAuto: false
      });
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onAddUser(): void {
    this.logger.debug(`list-users.component.onAddUser`);
    this.router.navigate(['/admin/register-user']);
  }

  onDetails(userId: string): void {
    this.logger.debug(`list-users.component.onDetails | userId: ${userId}`)
    this.router.navigate(['/admin/edit-user', userId]);
  }

  onIncludeInactiveUsersChanged(event: MatSlideToggleChange): void {
    this.logger.debug(`list-users.component.onIncludeInatciveUsersChanged | event: ${event.checked}`)
    this.includeInactiveUsers = event.checked;
    this.reloadData();
  }

}
