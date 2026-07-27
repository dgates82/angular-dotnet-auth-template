using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Infrastructure;

public static class TestUsers
{
    public static string NewEmail() => $"user-{Guid.NewGuid():N}@example.com";

    public const string DefaultPassword = "Passw0rd!";
}

public static class AccountTestHelper
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    // Registers via the real HTTP endpoint, then confirms the email using a token
    // generated straight from UserManager (rather than parsing it out of the Mailpit
    // email) and posts it through the real confirmEmail endpoint. Email delivery and
    // token encoding are covered by their own tests; this just gets a usable confirmed
    // account for tests that need one as a precondition.
    public static async Task RegisterAndConfirmAsync(HttpClient client, IServiceProvider services, string email, string password)
    {
        var registerResponse = await client.PostAsJsonAsync("/api/account/register",
            new { Email = email, Password = password }, JsonOptions);
        registerResponse.EnsureSuccessStatusCode();

        using var scope = services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByEmailAsync(email)
            ?? throw new InvalidOperationException($"User {email} was not created by /register");

        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var confirmResponse = await client.PostAsJsonAsync("/api/account/confirmEmail",
            new { UserId = user.Id, Code = code }, JsonOptions);
        confirmResponse.EnsureSuccessStatusCode();

        var confirmResult = await confirmResponse.Content.ReadFromJsonAsync<ResponseDto>(JsonOptions);
        if (confirmResult is null || !confirmResult.IsSuccess)
        {
            throw new InvalidOperationException($"Failed to confirm email for {email}");
        }
    }

    // Registers, confirms, and logs in as the new user, attaching the resulting JWT to
    // the client's default headers - for tests exercising self-service endpoints (2FA
    // enrollment) that require the caller to be authenticated as the target account.
    // Password-only login already issues a full token even before 2FA is configured
    // (see AccountController.Login), so this mirrors the real client-side flow.
    public static async Task RegisterConfirmAndAuthenticateAsync(HttpClient client, IServiceProvider services, string email, string password)
    {
        await RegisterAndConfirmAsync(client, services, email, password);

        var loginResponse = await client.PostAsJsonAsync("/api/account/login",
            new { Email = email, Password = password }, JsonOptions);
        loginResponse.EnsureSuccessStatusCode();

        var loginResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        if (loginResult is null || string.IsNullOrEmpty(loginResult.Token))
        {
            throw new InvalidOperationException($"Failed to log in as {email}");
        }

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginResult.Token);
    }
}
