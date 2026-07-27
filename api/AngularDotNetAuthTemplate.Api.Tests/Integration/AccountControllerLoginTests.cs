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
public class AccountControllerLoginTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AccountControllerLoginTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Login_WithUnknownEmail_ReturnsUnsuccessfulWithoutRevealingUserExists()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/account/login",
            new { Email = TestUsers.NewEmail(), Password = "whatever" }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(result!.IsAuthSuccessful);
    }

    [Fact]
    public async Task Login_BeforeEmailConfirmed_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        var registerResponse = await client.PostAsJsonAsync("/api/account/register",
            new { Email = email, Password = TestUsers.DefaultPassword }, AccountTestHelper.JsonOptions);
        registerResponse.EnsureSuccessStatusCode();

        var response = await client.PostAsJsonAsync("/api/account/login",
            new { Email = email, Password = TestUsers.DefaultPassword }, AccountTestHelper.JsonOptions);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithConfirmedUserAndCorrectPassword_ReturnsTokenAndUser()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var response = await client.PostAsJsonAsync("/api/account/login",
            new { Email = email, Password = TestUsers.DefaultPassword }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(result!.IsAuthSuccessful);
        Assert.False(string.IsNullOrEmpty(result.Token));
        Assert.False(result.RequiresTwoFactor);
        Assert.NotNull(result.User);
        Assert.Equal(email, result.User.Email);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var response = await client.PostAsJsonAsync("/api/account/login",
            new { Email = email, Password = "SomethingElse123!" }, AccountTestHelper.JsonOptions);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithInactiveUser_ReturnsUnsuccessfulWithMessage()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        using (var scope = _factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(email);
            user!.IsActive = false;
            await userManager.UpdateAsync(user);
        }

        var response = await client.PostAsJsonAsync("/api/account/login",
            new { Email = email, Password = TestUsers.DefaultPassword }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(result!.IsAuthSuccessful);
        Assert.Equal("User is not active", result.ErrorMessage);
    }
}
