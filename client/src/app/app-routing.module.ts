import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from "@features/account/login/login.component";
import { LogoutComponent } from '@features/account/logout/logout.component';
import { AuthGuard } from '@core/guards/auth.guard';
import { LoginGuard } from '@core/guards/login.guard';
import { RegisterComponent } from '@features/account/register/register.component';
import { ListUsersComponent } from '@features/admin/user/list-users/list-users.component';
import { ForbiddenComponent } from '@features/account/forbidden/forbidden.component';
import { ForgotPasswordComponent } from '@features/account/forgot-password/forgot-password/forgot-password.component';
import { ForgotPasswordConfirmComponent } from '@features/account/forgot-password/forgot-password-confirm/forgot-password-confirm.component';
import { PasswordResetComponent } from '@features/account/password-reset/password-reset.component';
import { EmailConfirmationComponent } from '@features/account/email-confirmation/email-confirmation.component';

import { ProfileRootComponent } from '@app/features/account/manage/profile/profile-root/profile-root.component';
import { EnableAuthenticatorComponent } from '@features/account/manage/two-fa/enable-authenticator/enable-authenticator.component';
import { EditUserComponent } from '@features/admin/user/edit-user/edit-user.component';
import { RegisterUserComponent } from '@features/admin/user/register-user/register-user.component';
import {
  EnableTwoFaRootComponent
} from "@features/account/manage/two-fa/enable-two-fa-root/enable-two-fa-root.component";
import {roleGuard} from "@core/guards/role.guard";
import {HomeComponent} from "@features/home/home.component";

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  /* Authentication */
  { path: 'login/:returnUrl', component: LoginComponent, canActivate: [LoginGuard], title: "Login - [App Name]" },
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] , title: "Login - [App Name]"},
  { path: 'logout', component: LogoutComponent, canActivate: [AuthGuard] , title: "Login - [App Name]"},
  { path: 'forbidden', component: ForbiddenComponent , title: "Forbidden - [App Name]"},
  /* Forgot Password */
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [LoginGuard] },
  { path: 'forgot-password/confirm', component: ForgotPasswordConfirmComponent, canActivate: [LoginGuard] },
  { path: 'forgot-password/reset', component: PasswordResetComponent },
  { path: 'forgot-password/reset/:code', component: PasswordResetComponent },
  /* Register */
  { path: 'register', component: RegisterComponent, canActivate: [LoginGuard] },
  /* Email Confirmation */
  { path: 'email-confirmation', component: EmailConfirmationComponent, canActivate: [LoginGuard] , title: "Confirm Email - [App Name]"},
  { path: 'email-confirmation/reset', component: PasswordResetComponent },
  /* Home */
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard], title: "Home - [App Name]" },
  /* Profile */
  { path: 'profile', component: ProfileRootComponent, canActivate: [AuthGuard], title: "Profile - [App Name]" },
  { path: 'enable2fa/:email', component: EnableTwoFaRootComponent },
  /* Admin */
  { path: 'admin/users', component: ListUsersComponent, canActivate: [AuthGuard, roleGuard(["Admin"])], title: "Users - [App Name]" },
  { path: 'admin/edit-user/:id', component: EditUserComponent, canActivate: [AuthGuard, roleGuard(["Admin"])]},
  { path: 'admin/register-user', component: RegisterUserComponent, canActivate: [AuthGuard, roleGuard(["Admin"])]}

  // { path: '**', component: ApplicationRootComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
