import { Routes } from '@angular/router';
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
import { EditUserComponent } from '@features/admin/user/edit-user/edit-user.component';
import { RegisterUserComponent } from '@features/admin/user/register-user/register-user.component';
import {
  EnableTwoFaRootComponent
} from "@features/account/manage/two-fa/enable-two-fa-root/enable-two-fa-root.component";
import { roleGuard } from "@core/guards/role.guard";
import { twoFaRequiredGuard } from "@core/guards/two-fa-required.guard";
import { allowSelfRegisterGuard } from "@core/guards/allow-self-register.guard";
import { HomeComponent } from "@features/home/home.component";

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  // TODO(template): Replace "[Application Name]" below with your app's name
  // (also used in api/.../AccountController.cs emails/SMS - see README).
  /* Authentication */
  { path: 'login/:returnUrl', component: LoginComponent, canActivate: [LoginGuard], title: "Login - [Application Name]" },
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] , title: "Login - [Application Name]"},
  { path: 'logout', component: LogoutComponent, canActivate: [AuthGuard] , title: "Login - [Application Name]"},
  { path: 'forbidden', component: ForbiddenComponent , title: "Forbidden - [Application Name]"},
  /* Forgot Password */
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [LoginGuard] },
  { path: 'forgot-password/confirm', component: ForgotPasswordConfirmComponent, canActivate: [LoginGuard] },
  { path: 'forgot-password/reset', component: PasswordResetComponent },
  { path: 'forgot-password/reset/:code', component: PasswordResetComponent },
  /* Register */
  { path: 'register', component: RegisterComponent, canActivate: [LoginGuard, allowSelfRegisterGuard] },
  /* Email Confirmation */
  { path: 'email-confirmation', component: EmailConfirmationComponent, canActivate: [LoginGuard] , title: "Confirm Email - [Application Name]"},
  { path: 'email-confirmation/reset', component: PasswordResetComponent },
  /* Home */
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard, twoFaRequiredGuard], title: "Home - [Application Name]" },
  /* Profile */
  { path: 'profile', component: ProfileRootComponent, canActivate: [AuthGuard, twoFaRequiredGuard], title: "Profile - [Application Name]" },
  { path: 'enable2fa/:email', component: EnableTwoFaRootComponent, canActivate: [AuthGuard] },
  /* Admin */
  { path: 'admin/users', component: ListUsersComponent, canActivate: [AuthGuard, twoFaRequiredGuard, roleGuard(["Admin"])], title: "Users - [Application Name]" },
  { path: 'admin/edit-user/:id', component: EditUserComponent, canActivate: [AuthGuard, twoFaRequiredGuard, roleGuard(["Admin"])]},
  { path: 'admin/register-user', component: RegisterUserComponent, canActivate: [AuthGuard, twoFaRequiredGuard, roleGuard(["Admin"])]}

  // { path: '**', component: ApplicationRootComponent, pathMatch: 'full' }
];
