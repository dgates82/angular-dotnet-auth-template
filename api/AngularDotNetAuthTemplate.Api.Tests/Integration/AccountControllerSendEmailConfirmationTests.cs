using System.Net.Http.Json;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public class AccountControllerSendEmailConfirmationTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AccountControllerSendEmailConfirmationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task SendEmailConfirmation_ForRegisteredUser_SendsEmail()
    {
        var mailpit = new MailpitClient();
        await mailpit.DeleteAllMessagesAsync();
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();

        var registerResponse = await client.PostAsJsonAsync("/api/account/register",
            new { Email = email, Password = TestUsers.DefaultPassword }, AccountTestHelper.JsonOptions);
        registerResponse.EnsureSuccessStatusCode();

        await mailpit.DeleteAllMessagesAsync();
        var response = await client.PostAsJsonAsync("/api/account/sendemailconfirmation",
            new { Email = email }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.True(result!.IsSuccess);
        Assert.NotNull(await mailpit.FindMessageToAsync(email, "Email Confirmation", TimeSpan.FromSeconds(10)));
    }

    [Fact]
    public async Task SendEmailConfirmation_ForUnknownEmail_DoesNotRevealUserExists()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/account/sendemailconfirmation",
            new { Email = TestUsers.NewEmail() }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.False(result!.IsSuccess);
    }

    [Fact]
    public async Task SendEmailConfirmation_IsReachableAnonymously()
    {
        // Deliberately unauthenticated: a user who hasn't confirmed their email yet has no
        // token, so this endpoint must work without one.
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        var registerResponse = await client.PostAsJsonAsync("/api/account/register",
            new { Email = email, Password = TestUsers.DefaultPassword }, AccountTestHelper.JsonOptions);
        registerResponse.EnsureSuccessStatusCode();

        var anonClient = _factory.CreateClient();
        var response = await anonClient.PostAsJsonAsync("/api/account/sendemailconfirmation",
            new { Email = email }, AccountTestHelper.JsonOptions);

        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
    }
}
