using Microsoft.AspNetCore.Identity;
using AngularDotNetAuthTemplate.Api.Models;

namespace AngularDotNetAuthTemplate.Api.Data
{
    public static class DbSeeder
    {
        public const string AdminRoleName = "Admin";

        // Runs on every startup; safe to call repeatedly. The admin role always
        // gets created. The admin user only gets created if SeedAdmin:Email and
        // SeedAdmin:Password are configured (appsettings.Development.json or
        // env vars/user-secrets) and no user with that email already exists.
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
