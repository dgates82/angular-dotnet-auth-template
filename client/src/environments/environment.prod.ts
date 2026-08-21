export const environment = {
  production: true,

  is2FaRequired: false,
  show2FaBanner: true,
  allowUserEdit: true,
  allowSelfRegister: true,
  twoFaMethods: ['Email', 'Sms', 'Authenticator'],

  requiredProfileFields: {
    firstName: true,
    lastName: true,
    phoneNumber: false,
    streetAddress: false,
    city: false,
    zipCode: false,
    state: false,
  },
};
