using System.Net;
using System.Net.Http.Json;
using System.Text;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public class AccountControllerPasswordResetTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AccountControllerPasswordResetTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ForgotPassword_ForConfirmedUser_SendsResetEmail()
    {
        var mailpit = new MailpitClient();
        await mailpit.DeleteAllMessagesAsync();
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var response = await client.PostAsJsonAsync("/api/account/forgotpassword",
            new { Email = email }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(result!.IsSuccess);

        var message = await mailpit.FindMessageToAsync(email, "Password Reset", TimeSpan.FromSeconds(10));
        Assert.NotNull(message);
    }

    [Fact]
    public async Task ForgotPassword_ForUnknownEmail_DoesNotRevealUserExists()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/account/forgotpassword",
            new { Email = TestUsers.NewEmail() }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(result!.IsSuccess);
    }

    [Fact]
    public async Task ResetPassword_WithValidCode_AllowsLoginWithNewPasswordOnly()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterAndConfirmAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        string code;
        using (var scope = _factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(email);
            var token = await userManager.GeneratePasswordResetTokenAsync(user!);
            code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        }

        const string newPassword = "NewPassw0rd!";
        var resetResponse = await client.PostAsJsonAsync("/api/account/resetpassword",
            new { Email = email, Password = newPassword, Code = code }, AccountTestHelper.JsonOptions);
        resetResponse.EnsureSuccessStatusCode();
        var resetResult = await resetResponse.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(resetResult!.IsSuccess);

        var oldPasswordLogin = await client.PostAsJsonAsync("/api/account/login",
            new { Email = email, Password = TestUsers.DefaultPassword }, AccountTestHelper.JsonOptions);
        Assert.Equal(HttpStatusCode.Unauthorized, oldPasswordLogin.StatusCode);

        var newPasswordLogin = await client.PostAsJsonAsync("/api/account/login",
            new { Email = email, Password = newPassword }, AccountTestHelper.JsonOptions);
        newPasswordLogin.EnsureSuccessStatusCode();
        var newPasswordResult = await newPasswordLogin.Content.ReadFromJsonAsync<AuthResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(newPasswordResult!.IsAuthSuccessful);
    }
}
