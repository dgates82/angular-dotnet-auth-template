using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AngularAndDotNetCoreAuthTemplate.Models;

namespace AngularAndDotNetCoreAuthTemplate.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<IdentityRole>().HasData(new IdentityRole
            {
                Id = "1F3FFE36-8174-4F46-9D53-3FBA4395328F",
                Name = "Admin",
                NormalizedName = "ADMIN"
            });

            var hasher = new PasswordHasher<ApplicationUser>();

            builder.Entity<ApplicationUser>().HasData(
                new ApplicationUser
                {
                    Id = "76283B4C-12BC-4656-9DEB-D5EEEE6E006E",
                    Email = "redacted@example.com",
                    FirstName = "David",
                    LastName = "Gates",
                    PasswordHash = hasher.HashPassword(null, "Password1!"),
                    UserName = "redacted@example.com",
                    NormalizedEmail = "REDACTED@EXAMPLE.COM"
                });

            builder.Entity<IdentityUserRole<string>>().HasData(
                new IdentityUserRole<string>
                {
                    RoleId = "1F3FFE36-8174-4F46-9D53-3FBA4395328F",
                    UserId = "76283B4C-12BC-4656-9DEB-D5EEEE6E006E"
                });

        }

    }
}