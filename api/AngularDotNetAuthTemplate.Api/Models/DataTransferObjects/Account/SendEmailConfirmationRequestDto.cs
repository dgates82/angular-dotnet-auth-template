namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    /// <summary>Request for <c>Account/sendemailconfirmation</c>.</summary>
    public class SendEmailConfirmationRequestDto
    {
        /// <summary>The email address to resend a confirmation link to.</summary>
        public required string Email { get; set; }
        // public bool IsFirstLogin { get; set; }
    }
}
