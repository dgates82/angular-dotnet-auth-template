using System.Net.Http.Json;
using System.Text.RegularExpressions;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public class AccountControllerEmailTwoFactorTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AccountControllerEmailTwoFactorTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task EnableAndVerifyEmail_ThenLoginRequiresAndAcceptsEmailCode()
    {
        var mailpit = new MailpitClient();
        await mailpit.DeleteAllMessagesAsync();
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var sendResponse = await client.PostAsJsonAsync("/api/account/SendTwoFaCode",
            new { Email = email, Method = "Email" }, AccountTestHelper.JsonOptions);
        sendResponse.EnsureSuccessStatusCode();
        var sendResult = await sendResponse.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(sendResult!.IsSuccess);

        var enrollCode = await ExtractCodeAsync(mailpit, email);

        var verifyResponse = await client.PostAsJsonAsync("/api/account/verifyauthenticator",
            new { Email = email, Method = "Email", Code = enrollCode }, AccountTestHelper.JsonOptions);
        verifyResponse.EnsureSuccessStatusCode();
        var verifyResult = await verifyResponse.Content
            .ReadFromJsonAsync<VerifyAuthenticatorResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(verifyResult!.IsVerified);

        // 2FA is now on, so a normal password login should stop short of issuing a token.
        var loginResponse = await client.PostAsJsonAsync("/api/account/login",
            new { Email = email, Password = TestUsers.DefaultPassword }, AccountTestHelper.JsonOptions);
        loginResponse.EnsureSuccessStatusCode();
        var loginResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(loginResult!.IsAuthSuccessful);
        Assert.True(loginResult.RequiresTwoFactor);
        Assert.Equal("Email", loginResult.TwoFactorMethod);

        await mailpit.DeleteAllMessagesAsync();
        var loginSendResponse = await client.PostAsJsonAsync("/api/account/SendTwoFaCode",
            new { Email = email, Method = "Email" }, AccountTestHelper.JsonOptions);
        loginSendResponse.EnsureSuccessStatusCode();
        var loginCode = await ExtractCodeAsync(mailpit, email);

        var login2FaResponse = await client.PostAsJsonAsync("/api/account/login2fa",
            new { Email = email, TwoFactorProvider = "Email", TwoFactorCode = loginCode },
            AccountTestHelper.JsonOptions);
        login2FaResponse.EnsureSuccessStatusCode();
        var login2FaResult = await login2FaResponse.Content.ReadFromJsonAsync<AuthResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(login2FaResult!.IsAuthSuccessful);
        Assert.False(string.IsNullOrEmpty(login2FaResult.Token));
    }

    [Fact]
    public async Task VerifyEmail_WithWrongCode_ReturnsNotVerified()
    {
        var mailpit = new MailpitClient();
        await mailpit.DeleteAllMessagesAsync();
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var sendResponse = await client.PostAsJsonAsync("/api/account/SendTwoFaCode",
            new { Email = email, Method = "Email" }, AccountTestHelper.JsonOptions);
        sendResponse.EnsureSuccessStatusCode();
        Assert.NotNull(await mailpit.FindMessageToAsync(email, "2FA Code", TimeSpan.FromSeconds(10)));

        var response = await client.PostAsJsonAsync("/api/account/verifyauthenticator",
            new { Email = email, Method = "Email", Code = "000000" }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<VerifyAuthenticatorResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(result!.IsVerified);
    }

    private static async Task<string> ExtractCodeAsync(MailpitClient mailpit, string email)
    {
        var message = await mailpit.FindMessageToAsync(email, "2FA Code", TimeSpan.FromSeconds(10));
        Assert.NotNull(message);

        var messageId = message!.Value.GetProperty("ID").GetString()!;
        var text = await mailpit.GetMessageTextAsync(messageId);
        var match = Regex.Match(text, @"is: (\d+)");
        Assert.True(match.Success, $"Could not find a code in email body: {text}");
        return match.Groups[1].Value;
    }
}
