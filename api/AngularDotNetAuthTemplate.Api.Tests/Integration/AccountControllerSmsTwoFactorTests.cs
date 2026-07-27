using System.Net.Http.Json;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public class AccountControllerSmsTwoFactorTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AccountControllerSmsTwoFactorTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task EnableAndVerifySms_ThenLoginRequiresAndAcceptsSmsCode()
    {
        var smsMock = new SmsMockClient();
        await smsMock.DeleteAllMessagesAsync();
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        const string phoneNumber = "5551234567";
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var sendResponse = await client.PostAsJsonAsync("/api/account/SendTwoFaCode",
            new { Email = email, Method = "Phone", PhoneNumber = phoneNumber }, AccountTestHelper.JsonOptions);
        sendResponse.EnsureSuccessStatusCode();
        var sendResult = await sendResponse.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(sendResult!.IsSuccess);

        var enrollCode = await ExtractCodeAsync(smsMock, phoneNumber);

        var verifyResponse = await client.PostAsJsonAsync("/api/account/verifyauthenticator",
            new { Email = email, Method = "Phone", Code = enrollCode, PhoneNumber = phoneNumber },
            AccountTestHelper.JsonOptions);
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
        Assert.Equal("Phone", loginResult.TwoFactorMethod);

        // Login sends its own fresh code (using the now-enrolled phone number) rather than
        // reusing the enrollment one - matches the real client's login flow.
        await smsMock.DeleteAllMessagesAsync();
        var loginSendResponse = await client.PostAsJsonAsync("/api/account/SendTwoFaCode",
            new { Email = email, Method = "Phone" }, AccountTestHelper.JsonOptions);
        loginSendResponse.EnsureSuccessStatusCode();
        var loginCode = await ExtractCodeAsync(smsMock, phoneNumber);

        var login2FaResponse = await client.PostAsJsonAsync("/api/account/login2fa",
            new { Email = email, TwoFactorProvider = "Phone", TwoFactorCode = loginCode },
            AccountTestHelper.JsonOptions);
        login2FaResponse.EnsureSuccessStatusCode();
        var login2FaResult = await login2FaResponse.Content.ReadFromJsonAsync<AuthResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(login2FaResult!.IsAuthSuccessful);
        Assert.False(string.IsNullOrEmpty(login2FaResult.Token));
    }

    [Fact]
    public async Task VerifySms_WithWrongCode_ReturnsNotVerified()
    {
        var smsMock = new SmsMockClient();
        await smsMock.DeleteAllMessagesAsync();
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        const string phoneNumber = "5559876543";
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var sendResponse = await client.PostAsJsonAsync("/api/account/SendTwoFaCode",
            new { Email = email, Method = "Phone", PhoneNumber = phoneNumber }, AccountTestHelper.JsonOptions);
        sendResponse.EnsureSuccessStatusCode();
        Assert.NotNull(await smsMock.FindMessageToAsync(phoneNumber, TimeSpan.FromSeconds(10)));

        var response = await client.PostAsJsonAsync("/api/account/verifyauthenticator",
            new { Email = email, Method = "Phone", Code = "000000", PhoneNumber = phoneNumber },
            AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<VerifyAuthenticatorResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(result!.IsVerified);
    }

    private static async Task<string> ExtractCodeAsync(SmsMockClient smsMock, string phoneNumber)
    {
        var message = await smsMock.FindMessageToAsync(phoneNumber, TimeSpan.FromSeconds(10));
        Assert.NotNull(message);

        var body = message!.Value.GetProperty("body").GetString() ?? "";
        var match = System.Text.RegularExpressions.Regex.Match(body, @"is: (\d+)");
        Assert.True(match.Success, $"Could not find a code in SMS body: {body}");
        return match.Groups[1].Value;
    }
}
