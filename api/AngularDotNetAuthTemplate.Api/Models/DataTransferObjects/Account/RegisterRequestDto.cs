namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    /// <summary>Request for <c>Account/register</c>.</summary>
    public class RegisterRequestDto
    {
        /// <summary>The new account's email address, also used as the username.</summary>
        public required string Email { get; set; }

        /// <summary>The new account's password.</summary>
        public required string Password { get; set; }
    }
}
