using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects;
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
}
