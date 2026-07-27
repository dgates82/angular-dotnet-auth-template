using System.Net;
using System.Net.Http.Json;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public class UserControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public UserControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_AsAdmin_ReturnsUserList()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsAdminAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var response = await client.GetAsync("/api/admin/user");

        response.EnsureSuccessStatusCode();
        var users = await response.Content.ReadFromJsonAsync<List<ApplicationUserDto>>(AccountTestHelper.JsonOptions);
        Assert.NotNull(users);
        Assert.Contains(users!, u => u.Email == email);
    }

    [Fact]
    public async Task Get_Anonymous_IsRejected()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/admin/user");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_AsNonAdmin_IsRejected()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var response = await client.GetAsync("/api/admin/user");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetById_AsAdmin_ReturnsUser()
    {
        var adminClient = _factory.CreateClient();
        var adminEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsAdminAsync(adminClient, _factory.Services, adminEmail, TestUsers.DefaultPassword);

        var targetClient = _factory.CreateClient();
        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(targetClient, _factory.Services, targetEmail, TestUsers.DefaultPassword);

        var getResponse = await adminClient.GetAsync($"/api/admin/user/get?id={await GetUserIdAsync(targetEmail)}");

        getResponse.EnsureSuccessStatusCode();
        var user = await getResponse.Content.ReadFromJsonAsync<ApplicationUserDto>(AccountTestHelper.JsonOptions);
        Assert.NotNull(user);
        Assert.Equal(targetEmail, user!.Email);
    }

    [Fact]
    public async Task GetById_Anonymous_IsRejected()
    {
        var client = _factory.CreateClient();
        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(_factory.CreateClient(), _factory.Services, targetEmail, TestUsers.DefaultPassword);

        var response = await client.GetAsync($"/api/admin/user/get?id={await GetUserIdAsync(targetEmail)}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetById_AsNonAdmin_IsRejected()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(_factory.CreateClient(), _factory.Services, targetEmail, TestUsers.DefaultPassword);

        var response = await client.GetAsync($"/api/admin/user/get?id={await GetUserIdAsync(targetEmail)}");

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
}
