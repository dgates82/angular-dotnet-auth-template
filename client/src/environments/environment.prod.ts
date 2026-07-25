export const environment = {
  production: true,

  is2FaRequired: false,
  allowUserEdit: true,
  allowSelfRegister: true,
  twoFaMethods: ['Email', 'Sms', 'Authenticator'],

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
