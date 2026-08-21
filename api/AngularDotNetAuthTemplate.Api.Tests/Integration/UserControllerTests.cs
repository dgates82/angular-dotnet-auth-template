using System.Net;
using System.Net.Http.Json;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

// List/get/create/activate/deactivate/unlock are served directly by
// DGates.Identity.Jwt2Fa under /api/auth and are covered by that package's own test
// suite. Put is the only endpoint this app still owns locally (app-specific profile
// fields, delegating email/role changes to IAuthCoreService.AdminUpdateUserAsync) -
// that delegation is the one piece of this app's own code worth testing here.
[Collection(IntegrationTestCollection.Name)]
public class UserControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public UserControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Put_AsAdmin_UpdatesProfileFieldsAndDelegatesRolesToAdminUpdateUser()
    {
        var adminClient = _factory.CreateClient();
        var adminEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsAdminAsync(adminClient, _factory.Services, adminEmail, TestUsers.DefaultPassword);

        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(_factory.CreateClient(), _factory.Services, targetEmail, TestUsers.DefaultPassword);
        var targetId = await GetUserIdAsync(targetEmail);

        await EnsureRoleExistsAsync("Support");

        var response = await adminClient.PutAsJsonAsync("/api/admin/user",
            new { Id = targetId, FirstName = "Updated", LastName = "Name", Roles = new List<string> { "Support" } },
            AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();

        using var scope = _factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var updated = await userManager.FindByIdAsync(targetId);
        Assert.Equal("Updated", updated!.FirstName);
        Assert.Equal("Name", updated.LastName);
        Assert.Contains("Support", await userManager.GetRolesAsync(updated));
    }

    [Fact]
    public async Task Put_WithUnknownId_ReturnsNotFound()
    {
        var adminClient = _factory.CreateClient();
        var adminEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsAdminAsync(adminClient, _factory.Services, adminEmail, TestUsers.DefaultPassword);

        var response = await adminClient.PutAsJsonAsync("/api/admin/user",
            new { Id = "missing", FirstName = "Updated", Roles = new List<string>() },
            AccountTestHelper.JsonOptions);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_Anonymous_IsRejected()
    {
        var client = _factory.CreateClient();
        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(_factory.CreateClient(), _factory.Services, targetEmail, TestUsers.DefaultPassword);
        var targetId = await GetUserIdAsync(targetEmail);

        var response = await client.PutAsJsonAsync("/api/admin/user",
            new { Id = targetId, FirstName = "Updated", Roles = new List<string>() }, AccountTestHelper.JsonOptions);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Put_AsNonAdmin_IsRejected()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(_factory.CreateClient(), _factory.Services, targetEmail, TestUsers.DefaultPassword);
        var targetId = await GetUserIdAsync(targetEmail);

        var response = await client.PutAsJsonAsync("/api/admin/user",
            new { Id = targetId, FirstName = "Updated", Roles = new List<string>() }, AccountTestHelper.JsonOptions);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task<string> GetUserIdAsync(string email)
    {
        using var scope = _factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByEmailAsync(email)
            ?? throw new InvalidOperationException($"User {email} not found");
        return user.Id;
    }

    private async Task EnsureRoleExistsAsync(string role)
    {
        using var scope = _factory.Services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }
}
