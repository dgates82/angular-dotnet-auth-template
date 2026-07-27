using System.Net;
using System.Net.Http.Json;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public class AccountControllerResetAuthenticatorTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AccountControllerResetAuthenticatorTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ResetAuthenticator_ForSelf_Succeeds()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var response = await client.PostAsJsonAsync("/api/account/resetauthenticator",
            new { Email = email }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(result!.IsSuccess);
    }

    [Fact]
    public async Task ResetAuthenticator_ForAnotherUser_AsAdmin_Succeeds()
    {
        var adminClient = _factory.CreateClient();
        var adminEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsAdminAsync(adminClient, _factory.Services, adminEmail, TestUsers.DefaultPassword);

        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(_factory.CreateClient(), _factory.Services, targetEmail, TestUsers.DefaultPassword);

        var response = await adminClient.PostAsJsonAsync("/api/account/resetauthenticator",
            new { Email = targetEmail }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(result!.IsSuccess);
    }

    [Fact]
    public async Task ResetAuthenticator_ForAnotherUser_WithoutAdminRole_IsRejected()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(_factory.CreateClient(), _factory.Services, targetEmail, TestUsers.DefaultPassword);

        var response = await client.PostAsJsonAsync("/api/account/resetauthenticator",
            new { Email = targetEmail }, AccountTestHelper.JsonOptions);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ResetAuthenticator_Anonymous_IsRejected()
    {
        var client = _factory.CreateClient();
        var targetEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(_factory.CreateClient(), _factory.Services, targetEmail, TestUsers.DefaultPassword);

        var response = await client.PostAsJsonAsync("/api/account/resetauthenticator",
            new { Email = targetEmail }, AccountTestHelper.JsonOptions);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
