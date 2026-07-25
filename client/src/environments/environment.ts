// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  // App-configurable feature flags, kept in environment files (rather than
  // hardcoded in component/service code) so a template consumer can toggle
  // them per build without touching application logic.
  is2FaRequired: false,
  allowUserEdit: true,
  allowSelfRegister: true,
  twoFaMethods: ['Email', 'Sms', 'Authenticator'],

  // Which profile fields are required on the register-user/edit-user/
  // edit-profile forms. Email is always required (it's the login name) and
  // isn't part of this config. A template consumer whose app doesn't need a
  // full mailing address, for example, can flip those to false here instead
  // of hunting down Validators.required in three separate components.
  requiredProfileFields: {
    firstName: true,
    lastName: true,
    phoneNumber: true,
    streetAddress: true,
    city: true,
    zipCode: true,
    state: true,
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
