import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-recovery-codes-list',
    templateUrl: './recovery-codes-list.component.html',
    styleUrls: ['./recovery-codes-list.component.scss']
})
export class RecoveryCodesListComponent implements OnInit {

  @Input() recoveryCodes: string[] | null = null;

  constructor() { }

  ngOnInit(): void {
  }

}
