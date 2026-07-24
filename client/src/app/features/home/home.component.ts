import { Component } from '@angular/core';
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent } from '@angular/material/card';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent]
})
export class HomeComponent {

}
