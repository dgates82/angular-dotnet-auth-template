namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    /// <summary>Request for <c>Account/confirmEmail</c>.</summary>
    public class ConfirmEmailRequestDto
    {
        /// <summary>The ID of the user confirming their email.</summary>
        public string UserId { get; set; }

        /// <summary>The email confirmation code from the link sent via <c>Account/register</c> or <c>Account/sendemailconfirmation</c>.</summary>
        public string Code { get; set; }
    }
}
