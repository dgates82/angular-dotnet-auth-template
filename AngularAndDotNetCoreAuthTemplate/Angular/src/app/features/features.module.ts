import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { QRCodeModule } from 'angularx-qrcode';
import { NgxMaskModule } from 'ngx-mask';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { DataTablesModule } from 'angular-datatables';

import { SharedModule } from '@shared/shared.module';
import { InterfacesModule } from '@interfaces/interfaces.module';
import { DataModule } from '@data/data.module';
import { CoreModule } from '@core/core.module';

import { LoginComponent } from '@features/account/login/login.component';
import { LogoutComponent } from '@features/account/logout/logout.component';


import { ListUsersComponent } from '@features/admin/user/list-users/list-users.component';
import { RegisterUserComponent } from '@features/admin/user/register-user/register-user.component';
import { NewApplicationComponent } from '@features/applications/new-application/new-application.component';
import { ApplicationDetailComponent } from '@features/applications/application-detail/application-detail.component';
import { ApplicationListComponent } from '@features/applications/application-list/application-list.component';
import { ApplicationRootComponent } from '@features/applications/application-root/application-root.component';
import { ForbiddenComponent } from '@features/account/forbidden/forbidden.component';
import { ForgotPasswordComponent } from '@features/account/forgot-password/forgot-password/forgot-password.component';
import { ForgotPasswordConfirmComponent } from '@features/account/forgot-password/forgot-password-confirm/forgot-password-confirm.component';
import { PasswordResetComponent } from '@features/account/password-reset/password-reset.component';
import { EmailConfirmationComponent } from '@features/account/email-confirmation/email-confirmation.component';

import { LoginTwoFactorComponent } from '@features/account/login/login-two-factor/login-two-factor.component';

import { ProfileRootComponent } from '@features/account/manage/profile/profile-root/profile-root.component';
import { ProfilePersonalInfoComponent } from '@features/account/manage/profile/profile-personal-info/profile-personal-info.component';
import { ProfileSecurityInfoComponent } from '@features/account/manage/profile/profile-security-info/profile-security-info.component';
import { UpdatePasswordComponent } from '@features/account/manage/update-password/update-password.component';
import { TwoFaRootComponent } from '@features/account/manage/two-fa/two-fa-root/two-fa-root.component';
import { EnableAuthenticatorComponent } from '@features/account/manage/two-fa/enable-authenticator/enable-authenticator.component';
import { RecoveryCodesListComponent } from './account/manage/two-fa/recovery-codes-list/recovery-codes-list.component';
import { EditUserComponent } from './admin/user/edit-user/edit-user.component';
import { AdminSecurityInfoComponent } from './admin/user/admin-security-info/admin-security-info.component';
import { AdminPersonalInfoComponent } from './admin/user/admin-personal-info/admin-personal-info.component';
import { RegisterComponent } from './account/register/register.component';
import { EnableTwoFaEmailComponent } from './account/manage/two-fa/enable-two-fa-email/enable-two-fa-email.component';
import { EnableTwoFaPhoneComponent } from './account/manage/two-fa/enable-two-fa-phone/enable-two-fa-phone.component';
import { EnableTwoFaMethodsComponent } from './account/manage/two-fa/enable-two-fa-methods/enable-two-fa-methods.component';
import { EnableTwoFaRootComponent } from './account/manage/two-fa/enable-two-fa-root/enable-two-fa-root.component';



@NgModule({
  declarations: [
    LoginComponent,
    LogoutComponent,
    ProfileRootComponent,
    EnableAuthenticatorComponent,
    ListUsersComponent,
    RegisterUserComponent,    
    NewApplicationComponent,
    ApplicationDetailComponent,
    ApplicationListComponent,
    ApplicationRootComponent,
    ForbiddenComponent,
    ForgotPasswordComponent,
    ForgotPasswordConfirmComponent,
    PasswordResetComponent,
    EmailConfirmationComponent,    
    LoginTwoFactorComponent,
    ProfilePersonalInfoComponent,
    ProfileSecurityInfoComponent,
    UpdatePasswordComponent,
    TwoFaRootComponent,
    RecoveryCodesListComponent,
    EditUserComponent,
    AdminSecurityInfoComponent,
    AdminPersonalInfoComponent,
    RegisterComponent,
    EnableTwoFaEmailComponent,
    EnableTwoFaPhoneComponent,
    EnableTwoFaMethodsComponent,
    EnableTwoFaRootComponent
    
  ],
  imports: [
    CommonModule,

    QRCodeModule,

    InterfacesModule,
    DataModule,
    CoreModule,

    BrowserModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    DataTablesModule,
    NgxMaskModule.forChild(),
    SweetAlert2Module.forChild()
    
  ]
})
export class FeaturesModule { }
