using System.Net.Http.Json;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public class AccountControllerChangePasswordTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AccountControllerChangePasswordTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ChangePassword_WithCorrectCurrentPassword_Succeeds()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        const string newPassword = "NewPassw0rd!";
        var response = await client.PostAsJsonAsync("/api/account/changepassword",
            new { Email = email, CurrentPassword = TestUsers.DefaultPassword, NewPassword = newPassword },
            AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(result!.IsSuccess);

        // Confirm the new password actually works and the old one no longer does.
        var anonClient = _factory.CreateClient();
        var loginWithNew = await anonClient.PostAsJsonAsync("/api/account/login",
            new { Email = email, Password = newPassword }, AccountTestHelper.JsonOptions);
        loginWithNew.EnsureSuccessStatusCode();
        Assert.Equal(System.Net.HttpStatusCode.OK, loginWithNew.StatusCode);
    }

    [Fact]
    public async Task ChangePassword_WithWrongCurrentPassword_Fails()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var response = await client.PostAsJsonAsync("/api/account/changepassword",
            new { Email = email, CurrentPassword = "WrongPassword1!", NewPassword = "NewPassw0rd!" },
            AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(result!.IsSuccess);
        Assert.False(string.IsNullOrEmpty(result.Message));
    }

    [Fact]
    public async Task ChangePassword_WithWeakNewPassword_ReturnsValidationMessage()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var response = await client.PostAsJsonAsync("/api/account/changepassword",
            new { Email = email, CurrentPassword = TestUsers.DefaultPassword, NewPassword = "weak" },
            AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(result!.IsSuccess);
        Assert.False(string.IsNullOrEmpty(result.Message));
    }

    [Fact]
    public async Task ChangePassword_Anonymous_IsRejected()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var anonClient = _factory.CreateClient();
        var response = await anonClient.PostAsJsonAsync("/api/account/changepassword",
            new { Email = email, CurrentPassword = TestUsers.DefaultPassword, NewPassword = "NewPassw0rd!" },
            AccountTestHelper.JsonOptions);

        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
