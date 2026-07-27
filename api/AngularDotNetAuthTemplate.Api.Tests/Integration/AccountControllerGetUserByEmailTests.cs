using System.Net;
using System.Net.Http.Json;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public class AccountControllerGetUserByEmailTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AccountControllerGetUserByEmailTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetUserByEmail_ForSelf_Succeeds()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var response = await client.GetAsync($"/api/account/getuserbyemail?email={email}");

        response.EnsureSuccessStatusCode();
        var user = await response.Content.ReadFromJsonAsync<ApplicationUserDto>(AccountTestHelper.JsonOptions);
        Assert.NotNull(user);
        Assert.Equal(email, user!.Email);
    }

    [Fact]
    public async Task GetUserByEmail_ForAnotherUser_AsAdmin_Succeeds()
    {
        var adminClient = _factory.CreateClient();
        var adminEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsAdminAsync(adminClient, _factory.Services, adminEmail, TestUsers.DefaultPassword);

        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(_factory.CreateClient(), _factory.Services, targetEmail, TestUsers.DefaultPassword);

        var response = await adminClient.GetAsync($"/api/account/getuserbyemail?email={targetEmail}");

        response.EnsureSuccessStatusCode();
        var user = await response.Content.ReadFromJsonAsync<ApplicationUserDto>(AccountTestHelper.JsonOptions);
        Assert.NotNull(user);
        Assert.Equal(targetEmail, user!.Email);
    }

    [Fact]
    public async Task GetUserByEmail_ForAnotherUser_WithoutAdminRole_IsRejected()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(_factory.CreateClient(), _factory.Services, targetEmail, TestUsers.DefaultPassword);

        var response = await client.GetAsync($"/api/account/getuserbyemail?email={targetEmail}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetUserByEmail_Anonymous_IsRejected()
    {
        var client = _factory.CreateClient();
        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(_factory.CreateClient(), _factory.Services, targetEmail, TestUsers.DefaultPassword);

        var response = await client.GetAsync($"/api/account/getuserbyemail?email={targetEmail}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
