using Microsoft.AspNetCore.Identity;
using AngularDotNetAuthTemplate.Api.Models;

namespace AngularDotNetAuthTemplate.Api.Data
{
    /// <summary>Seeds the database with baseline data (the admin role, and optionally a bootstrap admin user) on startup.</summary>
    public static class DbSeeder
    {
        /// <summary>The Identity role name used for admin users.</summary>
        public const string AdminRoleName = "Admin";

        /// <summary>
        /// Runs on every startup; safe to call repeatedly. The admin role always
        /// gets created. The admin user only gets created if <c>SeedAdmin:Email</c> and
        /// <c>SeedAdmin:Password</c> are configured (appsettings.Development.json or
        /// env vars/user-secrets) and no user with that email already exists.
        /// </summary>
        public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
        {
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            if (!await roleManager.RoleExistsAsync(AdminRoleName))
            {
                await roleManager.CreateAsync(new IdentityRole(AdminRoleName));
            }

            var email = configuration["SeedAdmin:Email"];
            var password = configuration["SeedAdmin:Password"];
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                return;
            }

            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
            if (await userManager.FindByEmailAsync(email) != null)
            {
                return;
            }

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true, // bootstrap account: skip the confirmation-email/first-login flow entirely
                HasSetPassword = true,
                FirstName = "Admin",
                LastName = "User"
            };

            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, AdminRoleName);
            }
        }
    }
}
