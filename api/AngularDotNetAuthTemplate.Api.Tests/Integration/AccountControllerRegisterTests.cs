using System.Net;
using System.Net.Http.Json;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public class AccountControllerRegisterTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AccountControllerRegisterTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_WithNewEmail_ReturnsSuccessAndSendsConfirmationEmail()
    {
        var mailpit = new MailpitClient();
        await mailpit.DeleteAllMessagesAsync();
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();

        var response = await client.PostAsJsonAsync("/api/account/register",
            new { Email = email, Password = TestUsers.DefaultPassword }, AccountTestHelper.JsonOptions);

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<ResponseDto>(AccountTestHelper.JsonOptions);
        Assert.NotNull(result);
        Assert.True(result!.IsSuccess);

        var message = await mailpit.FindMessageToAsync(email, "Email Confirmation", TimeSpan.FromSeconds(10));
        Assert.NotNull(message);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        var payload = new { Email = email, Password = TestUsers.DefaultPassword };

        var first = await client.PostAsJsonAsync("/api/account/register", payload, AccountTestHelper.JsonOptions);
        first.EnsureSuccessStatusCode();

        var second = await client.PostAsJsonAsync("/api/account/register", payload, AccountTestHelper.JsonOptions);

        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }
}
