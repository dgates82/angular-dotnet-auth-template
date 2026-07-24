namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    /// <summary>Request for <c>Account/resetpassword</c>.</summary>
    public class ResetPasswordRequestDto
    {
        /// <summary>The email address of the account resetting its password.</summary>
        public string Email { get; set; }

        /// <summary>The new password to set.</summary>
        public string Password { get; set; }

        /// <summary>The password reset code emailed to the user via <c>Account/forgotpassword</c>.</summary>
        public string Code { get; set; }
    }
}
