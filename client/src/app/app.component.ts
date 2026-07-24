import { Component } from '@angular/core';
import { NavigationSidenavComponent } from './features/navigation-sidenav/navigation-sidenav.component';



@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [NavigationSidenavComponent]
})
export class AppComponent {

}
