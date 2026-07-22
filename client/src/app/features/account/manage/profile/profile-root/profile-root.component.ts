import { Component, OnInit } from '@angular/core';

import { faLock, faUser } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-profile-root',
  templateUrl: './profile-root.component.html',
  styleUrls: ['./profile-root.component.scss']
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
