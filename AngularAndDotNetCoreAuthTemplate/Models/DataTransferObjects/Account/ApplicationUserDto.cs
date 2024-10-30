namespace AngularAndDotNetCoreAuthTemplate.Models.DataTransferObjects.Account
{
    public class ApplicationUserDto
    {
        public string Email { get; set; }
        public bool IsTwoFaEnabled { get; set; }
        public bool HasSetPassword { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string FullName { get; set; }
        public bool IsAdmin { get; set; }
        public string? StreetAddress { get; set; }
        public string? ZipCode { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ApplicationUserDto CreatedByUser { get; set; }
        public ApplicationUserDto UpdatedByUser { get; set; }

        public ApplicationUserDto()
        {
            // Empty on purpose
        }

        // HACK: Should pass in list of roles instaed of isAdmin?
        public ApplicationUserDto(ApplicationUser user, bool isAdmin)
        {
            Email = user.Email;
            IsTwoFaEnabled = user.TwoFactorEnabled;
            HasSetPassword = user.HasSetPassword;
            IsActive = user.IsActive;
            FirstName = user.FirstName;
            LastName = user.LastName;
            FullName = user.FullName;
            IsAdmin = isAdmin;         
            StreetAddress = user.StreetAddress;
            ZipCode = user.ZipCode;
            City = user.City;
            State = user.State;
            CreatedAt = user.CreatedAt;
            UpdatedAt = user.UpdatedAt;
                
        }                

    }

    
}
