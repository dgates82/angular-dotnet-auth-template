using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using AngularDotNetAuthTemplate.Api.Models;
using DGates.Identity.Jwt2Fa.Dtos;
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
    // generated straight from UserManager (rather than parsing it out of the mocked
    // email) and posts it through the real confirmEmail endpoint. Email delivery and
    // token encoding are covered by their own tests; this just gets a usable confirmed
    // account for tests that need one as a precondition.
    public static async Task RegisterAndConfirmAsync(HttpClient client, IServiceProvider services, string email, string password)
    {
        var registerResponse = await client.PostAsJsonAsync("/api/auth/register",
            new { Email = email, Password = password }, JsonOptions);
        registerResponse.EnsureSuccessStatusCode();

        using var scope = services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByEmailAsync(email)
            ?? throw new InvalidOperationException($"User {email} was not created by /register");

        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var confirmResponse = await client.PostAsJsonAsync("/api/auth/confirmEmail",
            new { UserId = user.Id, Code = code }, JsonOptions);
        confirmResponse.EnsureSuccessStatusCode();

        var confirmResult = await confirmResponse.Content.ReadFromJsonAsync<ResponseDto>(JsonOptions);
        if (confirmResult is null || !confirmResult.IsSuccess)
        {
            throw new InvalidOperationException($"Failed to confirm email for {email}");
        }
    }

    // Registers, confirms, and logs in as the new user, attaching the resulting JWT to
    // the client's default headers - for tests exercising endpoints that require the
    // caller to be authenticated.
    public static async Task RegisterConfirmAndAuthenticateAsync(HttpClient client, IServiceProvider services, string email, string password)
    {
        await RegisterAndConfirmAsync(client, services, email, password);
        await LoginAndAttachTokenAsync(client, email, password);
    }

    // Same as RegisterConfirmAndAuthenticateAsync, but assigns the Admin role first so
    // the login response's embedded role claim (and any [Authorize(Roles = "Admin")]
    // check) reflects it.
    public static async Task RegisterConfirmAndAuthenticateAsAdminAsync(HttpClient client, IServiceProvider services, string email, string password)
    {
        await RegisterAndConfirmAsync(client, services, email, password);

        using (var scope = services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByEmailAsync(email)
                ?? throw new InvalidOperationException($"User {email} was not created by /register");
            await userManager.AddToRoleAsync(user, "Admin");
        }

        await LoginAndAttachTokenAsync(client, email, password);
    }

    private static async Task LoginAndAttachTokenAsync(HttpClient client, string email, string password)
    {
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login",
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
