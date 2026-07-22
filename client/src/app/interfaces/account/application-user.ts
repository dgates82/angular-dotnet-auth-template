
export interface IApplicationUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  twoFactorEnabled: boolean;
  hasSetPassword: boolean;
  isActive: boolean;
  firstName: string;
  lastName: string;
  fullName?: string;
  phoneNumber?: string;
  streetAddress?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  roles?: string[];
  twoFactorMethod?: string;
  lockoutEnd?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  createdById?: string;
  updatedById?: string;
}
