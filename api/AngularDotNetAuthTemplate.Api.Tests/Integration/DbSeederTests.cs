using AngularDotNetAuthTemplate.Api.Data;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

// CustomWebApplicationFactory hardcodes SeedAdmin:Email/Password to empty so app startup
// doesn't seed an admin ahead of every test - that's exactly the branch these tests cover,
// by calling DbSeeder.SeedAsync directly with its own in-test IConfiguration instead of
// relying on the app's real startup config.
[Collection(IntegrationTestCollection.Name)]
public class DbSeederTests
{
    private readonly CustomWebApplicationFactory _factory;

    public DbSeederTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static IConfiguration BuildConfig(string? email, string? password)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["SeedAdmin:Email"] = email,
                ["SeedAdmin:Password"] = password
            })
            .Build();
    }

    [Fact]
    public async Task SeedAsync_WithEmailAndPassword_CreatesAdminUserInAdminRole()
    {
        using var scope = _factory.Services.CreateScope();
        var email = TestUsers.NewEmail();
        var config = BuildConfig(email, TestUsers.DefaultPassword);

        await DbSeeder.SeedAsync(scope.ServiceProvider, config);

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByEmailAsync(email);
        Assert.NotNull(user);
        Assert.Contains(DbSeeder.AdminRoleName, await userManager.GetRolesAsync(user!));
    }

    [Fact]
    public async Task SeedAsync_CalledTwice_DoesNotCreateADuplicateAdmin()
    {
        using var scope = _factory.Services.CreateScope();
        var email = TestUsers.NewEmail();
        var config = BuildConfig(email, TestUsers.DefaultPassword);

        await DbSeeder.SeedAsync(scope.ServiceProvider, config);
        await DbSeeder.SeedAsync(scope.ServiceProvider, config);

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByEmailAsync(email);
        Assert.NotNull(user);
    }

    [Fact]
    public async Task SeedAsync_WithoutEmailOrPassword_SkipsAdminCreationButStillSeedsRoles()
    {
        using var scope = _factory.Services.CreateScope();
        var config = BuildConfig(null, null);
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        await DbSeeder.SeedAsync(scope.ServiceProvider, config);

        Assert.True(await roleManager.RoleExistsAsync(DbSeeder.AdminRoleName));
    }
}
