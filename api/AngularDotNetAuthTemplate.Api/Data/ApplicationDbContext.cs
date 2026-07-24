using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AngularDotNetAuthTemplate.Api.Models;

namespace AngularDotNetAuthTemplate.Api.Data
{
    /// <summary>EF Core database context, extending Identity's context with <see cref="ApplicationUser"/> as the user type.</summary>
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        /// <summary>Creates the context with the given EF Core options (connection string, provider, etc.).</summary>
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        /// <inheritdoc />
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
        }

    }
}