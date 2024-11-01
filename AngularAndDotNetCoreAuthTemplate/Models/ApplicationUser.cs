using Microsoft.AspNetCore.Identity;
using AngularAndDotNetCoreAuthTemplate.Data;
using System.ComponentModel.DataAnnotations.Schema;

namespace AngularAndDotNetCoreAuthTemplate.Models
{
    public class ApplicationUser : IdentityUser, IEntity
    {
        public bool HasSetPassword { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? FullName => $"{FirstName} {LastName}".Trim();
        public string? StreetAddress { get; set; }
        public string? ZipCode { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        [NotMapped]
        public List<string> Roles { get; set; } = new List<string>();
        public string? TwoFactorMethod { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        // HACK I don't like this, but the first user can't be inserted unless this is nullable
        [ForeignKey("CreatedByUser")]
        public string? CreatedById { get; set; }

        [ForeignKey("UpdatedByUser")]
        public string? UpdatedById { get; set; }
        
        public virtual ApplicationUser? CreatedByUser { get; set; }
        public virtual ApplicationUser? UpdatedByUser { get; set; }
        
       

    }
}
