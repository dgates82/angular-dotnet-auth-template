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
        public required string Id { get; set; }
        public required string Email { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public bool HasSetPassword { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? StreetAddress { get; set; }
        public string? ZipCode { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public string? TwoFactorMethod { get; set; }
        public DateTimeOffset? LockoutEnd { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CreatedById { get; set; }
        public string? UpdatedById { get; set; }

        // System.Text.Json needs a parameterless constructor to deserialize this type (e.g. in
        // tests reading a server response) - without one it picks the ApplicationUser
        // constructor below as the deserialization constructor and fails to bind it.
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
