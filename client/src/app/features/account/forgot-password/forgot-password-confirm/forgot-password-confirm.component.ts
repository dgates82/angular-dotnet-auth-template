import { Component, OnInit } from '@angular/core';
import { MatCard, MatCardContent, MatCardTitle, MatCardSubtitle } from '@angular/material/card';

@Component({
    selector: 'app-forgot-password-confirm',
    templateUrl: './forgot-password-confirm.component.html',
    styleUrls: ['./forgot-password-confirm.component.scss'],
    imports: [MatCard, MatCardContent, MatCardTitle, MatCardSubtitle]
})
export class ForgotPasswordConfirmComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
