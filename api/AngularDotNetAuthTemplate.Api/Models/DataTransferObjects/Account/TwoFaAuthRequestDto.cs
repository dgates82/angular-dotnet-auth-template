namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    /// <summary>Request for <c>Account/login2fa</c>.</summary>
    public class TwoFaAuthRequestDto
    {
        /// <summary>The email address completing a two-factor login.</summary>
        public string Email { get; set; }

        /// <summary>The 2FA method being used: "Authenticator", "Email", "Phone", or "Sms".</summary>
        public string TwoFactorProvider { get; set; }

        /// <summary>The 2FA code submitted for verification.</summary>
        public string TwoFactorCode { get; set; }
    }
}
