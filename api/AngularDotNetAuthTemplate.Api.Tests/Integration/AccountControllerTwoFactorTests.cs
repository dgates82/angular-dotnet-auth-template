using System.Net.Http.Json;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Microsoft.AspNetCore.WebUtilities;
using OtpNet;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public class AccountControllerTwoFactorTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AccountControllerTwoFactorTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task EnableAndVerifyAuthenticator_ThenLoginRequiresAndAcceptsTotpCode()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var enableResponse = await client.PostAsJsonAsync("/api/account/enableauthenticator",
            new { Email = email }, AccountTestHelper.JsonOptions);
        enableResponse.EnsureSuccessStatusCode();
        var enableResult = await enableResponse.Content
            .ReadFromJsonAsync<EnableAuthenticatorResponseDto>(AccountTestHelper.JsonOptions);
        Assert.NotNull(enableResult);

        var totp = new Totp(Base32Encoding.ToBytes(ExtractSecret(enableResult!.AuthenticatorUri)));

        var verifyResponse = await client.PostAsJsonAsync("/api/account/verifyauthenticator",
            new { Email = email, Method = "Authenticator", Code = totp.ComputeTotp() }, AccountTestHelper.JsonOptions);
        verifyResponse.EnsureSuccessStatusCode();
        var verifyResult = await verifyResponse.Content
            .ReadFromJsonAsync<VerifyAuthenticatorResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(verifyResult!.IsVerified);
        Assert.NotNull(verifyResult.Codes);
        Assert.Equal(10, verifyResult.Codes.Length);

        // 2FA is now on, so a normal password login should stop short of issuing a token.
        var loginResponse = await client.PostAsJsonAsync("/api/account/login",
            new { Email = email, Password = TestUsers.DefaultPassword }, AccountTestHelper.JsonOptions);
        loginResponse.EnsureSuccessStatusCode();
        var loginResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(loginResult!.IsAuthSuccessful);
        Assert.True(loginResult.RequiresTwoFactor);

        var login2FaResponse = await client.PostAsJsonAsync("/api/account/login2fa",
            new { Email = email, TwoFactorProvider = "Authenticator", TwoFactorCode = totp.ComputeTotp() },
            AccountTestHelper.JsonOptions);
        login2FaResponse.EnsureSuccessStatusCode();
        var login2FaResult = await login2FaResponse.Content.ReadFromJsonAsync<AuthResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(login2FaResult!.IsAuthSuccessful);
        Assert.False(string.IsNullOrEmpty(login2FaResult.Token));
    }

    [Fact]
    public async Task VerifyAuthenticator_WithWrongCode_ReturnsNotVerified()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var enableResponse = await client.PostAsJsonAsync("/api/account/enableauthenticator",
            new { Email = email }, AccountTestHelper.JsonOptions);
        enableResponse.EnsureSuccessStatusCode();

        var response = await client.PostAsJsonAsync("/api/account/verifyauthenticator",
            new { Email = email, Method = "Authenticator", Code = "000000" }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<VerifyAuthenticatorResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(result!.IsVerified);
    }

    [Fact]
    public async Task SendTwoFaCode_ForAuthenticatorMethod_IsRejected()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var response = await client.PostAsJsonAsync("/api/account/SendTwoFaCode",
            new { Email = email, Method = "Authenticator" }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(result!.IsSuccess);
    }

    private static string ExtractSecret(string authenticatorUri)
    {
        var query = QueryHelpers.ParseQuery(new Uri(authenticatorUri).Query);
        return query["secret"].ToString();
    }
}
