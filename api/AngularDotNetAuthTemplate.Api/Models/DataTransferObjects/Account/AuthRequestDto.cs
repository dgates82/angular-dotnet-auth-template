namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    /// <summary>Request for <c>Account/login</c>.</summary>
    public class AuthRequestDto
    {
        /// <summary>The email address to authenticate.</summary>
        public required string Email { get; set; }

        /// <summary>The account's password.</summary>
        public required string Password { get; set; }
    }
}
