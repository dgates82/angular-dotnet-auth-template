using Microsoft.AspNetCore.Identity;
using AngularDotNetAuthTemplate.Api.Data;
using System.ComponentModel.DataAnnotations.Schema;

namespace AngularDotNetAuthTemplate.Api.Models
{
    /// <summary>The Identity user entity, extended with the app's own profile, 2FA, and audit fields.</summary>
    public class ApplicationUser : IdentityUser, IEntity
    {
        /// <summary>Whether the user has set their own password, as opposed to still using an admin-assigned one.</summary>
        public bool HasSetPassword { get; set; } = false;
        /// <summary>Whether the user's account is active. Deactivated users cannot log in.</summary>
        public bool IsActive { get; set; } = true;
        /// <summary>The user's first name.</summary>
        public string? FirstName { get; set; }
        /// <summary>The user's last name.</summary>
        public string? LastName { get; set; }
        /// <summary>The user's first and last name combined.</summary>
        public string? FullName => $"{FirstName} {LastName}".Trim();
        /// <summary>The user's street address.</summary>
        public string? StreetAddress { get; set; }
        /// <summary>The user's zip/postal code.</summary>
        public string? ZipCode { get; set; }
        /// <summary>The user's city.</summary>
        public string? City { get; set; }
        /// <summary>The user's state.</summary>
        public string? State { get; set; }
        /// <summary>The Identity roles assigned to this user. Not mapped - roles are stored via Identity's own role tables.</summary>
        [NotMapped]
        public List<string> Roles { get; set; } = new List<string>();
        /// <summary>Which two-factor method the user has configured (e.g. Email, Sms, Authenticator).</summary>
        public string? TwoFactorMethod { get; set; }
        /// <summary>When the user account was created.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        /// <summary>When the user account was last updated.</summary>
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // Nullable because the very first user in the system (e.g. the DbSeeder
        // admin) can't reference a creator that doesn't exist yet.
        /// <summary>The id of the admin user who created this account, if created by an admin.</summary>
        [ForeignKey("CreatedByUser")]
        public string? CreatedById { get; set; }

        /// <summary>The id of the admin user who last updated this account, if last updated by an admin.</summary>
        [ForeignKey("UpdatedByUser")]
        public string? UpdatedById { get; set; }

        /// <summary>The admin user who created this account, if created by an admin.</summary>
        public virtual ApplicationUser? CreatedByUser { get; set; }
        /// <summary>The admin user who last updated this account, if last updated by an admin.</summary>
        public virtual ApplicationUser? UpdatedByUser { get; set; }
        
       

    }
}
