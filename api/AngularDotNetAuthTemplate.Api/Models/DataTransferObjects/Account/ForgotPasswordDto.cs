namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    /// <summary>Request for <c>Account/forgotpassword</c>.</summary>
    public class ForgotPasswordDto
    {
        /// <summary>The email address of the account requesting a password reset.</summary>
        public required string Email { get; set; }

        /// <summary>Unused by <c>AccountController.ForgotPassword</c>; the reset code is generated server-side and delivered by email instead.</summary>
        public string? Token { get; set; }

    }
}
