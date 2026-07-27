namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    /// <summary>Request for <c>Account/enableauthenticator</c> and <c>Account/resetauthenticator</c>.</summary>
    public class EnableAuthenticatorRequestDto
    {
        /// <summary>The email address of the account enabling or resetting authenticator-app 2FA.</summary>
        public required string Email { get; set; }
    }
}
