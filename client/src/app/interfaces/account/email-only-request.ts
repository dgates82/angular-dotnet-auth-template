// Shared request shape for the several Account endpoints that only need an
// email address: send-email-confirmation, enable-authenticator, and
// reset-authenticator.
export interface IEmailOnlyRequest {
  email: string;
}
