namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    /// <summary>
    /// A trimmed-down user projection, omitting Identity internals like password
    /// hashes and security stamps. Used everywhere a user is sent to the client
    /// (JWT claims, login/lookup responses, admin user CRUD) instead of the raw
    /// <see cref="Models.ApplicationUser"/> entity.
    /// </summary>
    public class ApplicationUserDto
    {
        /// <summary>The user's unique identifier.</summary>
        public required string Id { get; set; }
        /// <summary>The user's email address, also used as their login name.</summary>
        public required string Email { get; set; }
        /// <summary>Whether the user has confirmed their email address.</summary>
        public bool EmailConfirmed { get; set; }
        /// <summary>Whether two-factor authentication is enabled for this user.</summary>
        public bool TwoFactorEnabled { get; set; }
        /// <summary>Whether the user has set their own password, as opposed to still using an admin-assigned one.</summary>
        public bool HasSetPassword { get; set; } = false;
        /// <summary>Whether the user's account is active. Deactivated users cannot log in.</summary>
        public bool IsActive { get; set; } = true;
        /// <summary>The user's first name.</summary>
        public string? FirstName { get; set; }
        /// <summary>The user's last name.</summary>
        public string? LastName { get; set; }
        /// <summary>The user's first and last name combined.</summary>
        public string? FullName { get; set; }
        /// <summary>The user's phone number.</summary>
        public string? PhoneNumber { get; set; }
        /// <summary>The user's street address.</summary>
        public string? StreetAddress { get; set; }
        /// <summary>The user's zip/postal code.</summary>
        public string? ZipCode { get; set; }
        /// <summary>The user's city.</summary>
        public string? City { get; set; }
        /// <summary>The user's state.</summary>
        public string? State { get; set; }
        /// <summary>The Identity roles assigned to this user.</summary>
        public List<string> Roles { get; set; } = new List<string>();
        /// <summary>Which two-factor method the user has configured (e.g. Email, Sms, Authenticator).</summary>
        public string? TwoFactorMethod { get; set; }
        /// <summary>If the account is currently locked out, when that lockout ends.</summary>
        public DateTimeOffset? LockoutEnd { get; set; }
        /// <summary>When the user account was created.</summary>
        public DateTime CreatedAt { get; set; }
        /// <summary>When the user account was last updated.</summary>
        public DateTime UpdatedAt { get; set; }
        /// <summary>The id of the admin user who created this account, if created by an admin.</summary>
        public string? CreatedById { get; set; }
        /// <summary>The id of the admin user who last updated this account, if last updated by an admin.</summary>
        public string? UpdatedById { get; set; }

        /// <summary>
        /// System.Text.Json needs a parameterless constructor to deserialize this type (e.g. in
        /// tests reading a server response) - without one it picks the ApplicationUser
        /// constructor below as the deserialization constructor and fails to bind it.
        /// </summary>
        public ApplicationUserDto()
        {
        }

        /// <summary>Projects an <see cref="Models.ApplicationUser"/> down to this DTO's fields.</summary>
        [System.Diagnostics.CodeAnalysis.SetsRequiredMembers]
        public ApplicationUserDto(ApplicationUser user)
        {
            Id = user.Id;
            Email = user.Email!;
            EmailConfirmed = user.EmailConfirmed;
            TwoFactorEnabled = user.TwoFactorEnabled;
            HasSetPassword = user.HasSetPassword;
            IsActive = user.IsActive;
            FirstName = user.FirstName;
            LastName = user.LastName;
            FullName = user.FullName;
            PhoneNumber = user.PhoneNumber;
            StreetAddress = user.StreetAddress;
            ZipCode = user.ZipCode;
            City = user.City;
            State = user.State;
            Roles = user.Roles;
            TwoFactorMethod = user.TwoFactorMethod;
            LockoutEnd = user.LockoutEnd;
            CreatedAt = user.CreatedAt;
            UpdatedAt = user.UpdatedAt;
            CreatedById = user.CreatedById;
            UpdatedById = user.UpdatedById;
        }
    }
}
