import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-recovery-codes-list',
    templateUrl: './recovery-codes-list.component.html',
    styleUrls: ['./recovery-codes-list.component.scss']
})
export class RecoveryCodesListComponent {

  @Input() recoveryCodes: string[] | null = null;

}
