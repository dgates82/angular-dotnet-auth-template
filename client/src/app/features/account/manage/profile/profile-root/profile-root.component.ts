import { Component, OnInit } from '@angular/core';

import { faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ProfilePersonalInfoComponent } from '../profile-personal-info/profile-personal-info.component';
import { ProfileSecurityInfoComponent } from '../profile-security-info/profile-security-info.component';

@Component({
    selector: 'app-profile-root',
    templateUrl: './profile-root.component.html',
    styleUrls: ['./profile-root.component.scss'],
    imports: [MatTabGroup, MatTab, MatTabLabel, FaIconComponent, ProfilePersonalInfoComponent, ProfileSecurityInfoComponent]
})
export class ProfileRootComponent implements OnInit {

  constructor() { }

  icons = {
    personal: faUser,
    security: faLock

  }

  ngOnInit(): void {

  }

}
