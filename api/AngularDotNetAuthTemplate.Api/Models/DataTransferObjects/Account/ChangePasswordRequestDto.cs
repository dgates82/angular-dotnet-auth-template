namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    /// <summary>Request for <c>Account/changepassword</c>.</summary>
    public class ChangePasswordRequestDto
    {
        /// <summary>The email address of the account changing its password.</summary>
        public string Email { get; set; }

        /// <summary>The user's current password, required to authorize the change.</summary>
        public string CurrentPassword { get; set; }

        /// <summary>The new password to set.</summary>
        public string NewPassword { get; set; }
    }
}
