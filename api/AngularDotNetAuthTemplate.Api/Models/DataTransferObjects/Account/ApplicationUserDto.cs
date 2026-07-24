namespace AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account
{
    /// <summary>
    /// A trimmed-down user projection, omitting Identity internals like password
    /// hashes and security stamps. Currently unused — controllers return
    /// <see cref="Models.ApplicationUser"/> directly (see the commented-out
    /// reference in <c>AccountController.Login2Fa</c>).
    /// </summary>
    public class ApplicationUserDto
    {
        public string Email { get; set; }
        public bool IsTwoFaEnabled { get; set; }
        public bool HasSetPassword { get; set; } = false;
        public bool IsLockedOut { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName { get; set; }
        public string? StreetAddress { get; set; }
        public string? ZipCode { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ApplicationUserDto CreatedByUser { get; set; }
        public ApplicationUserDto UpdatedByUser { get; set; }

        /// <summary>Creates an empty DTO for the caller to populate manually.</summary>
        public ApplicationUserDto()
        {
            // Empty on purpose
        }

        /// <summary>Projects an <see cref="Models.ApplicationUser"/> down to this DTO's fields.</summary>
        public ApplicationUserDto(ApplicationUser user)
        {
            Email = user.Email;
            IsTwoFaEnabled = user.TwoFactorEnabled;
            HasSetPassword = user.HasSetPassword;
            IsActive = user.IsActive;
            FirstName = user.FirstName;
            LastName = user.LastName;
            FullName = user.FullName;
            StreetAddress = user.StreetAddress;
            ZipCode = user.ZipCode;
            City = user.City;
            State = user.State;
            CreatedAt = user.CreatedAt;
            UpdatedAt = user.UpdatedAt;
                
        }                

    }

    
}
