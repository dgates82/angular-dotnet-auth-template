using System.Net;
using System.Net.Http.Json;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

// DbSeeder always creates the Admin/Tech/Manager roles on startup regardless of
// SeedAdmin config, so those three are guaranteed present without any per-test setup -
// other integration tests running in the same shared schema may add more roles, so
// assertions here check for a superset/ordering property rather than an exact list.
[Collection(IntegrationTestCollection.Name)]
public class RolesControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public RolesControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_AsAdmin_ReturnsSeededRoleNamesSortedAlphabetically()
    {
        var adminClient = _factory.CreateClient();
        var adminEmail = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsAdminAsync(adminClient, _factory.Services, adminEmail, TestUsers.DefaultPassword);

        var response = await adminClient.GetAsync("/api/admin/roles");
        response.EnsureSuccessStatusCode();

        var roleNames = await response.Content.ReadFromJsonAsync<string[]>(AccountTestHelper.JsonOptions);
        Assert.NotNull(roleNames);
        Assert.Superset(new HashSet<string> { "Admin", "Manager", "Tech" }, roleNames!.ToHashSet());
        Assert.Equal(roleNames!.OrderBy(name => name, StringComparer.Ordinal), roleNames);
    }

    [Fact]
    public async Task Get_Anonymous_IsRejected()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/admin/roles");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_AsNonAdmin_IsRejected()
    {
        var client = _factory.CreateClient();
        var email = TestUsers.NewEmail();
        await AccountTestHelper.RegisterConfirmAndAuthenticateAsync(client, _factory.Services, email, TestUsers.DefaultPassword);

        var response = await client.GetAsync("/api/admin/roles");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
