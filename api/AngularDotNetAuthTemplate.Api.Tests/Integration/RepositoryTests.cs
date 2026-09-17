using AngularDotNetAuthTemplate.Api.Data;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Integration;

// Repository<T> is a thin, generic EF Core wrapper - exercised here directly against the
// same disposable "AuthTemplateTest" schema the controller integration tests use, rather
// than mocked, since there's no mocking library in this project and a real DB round-trip
// is just as easy to set up.
[Collection(IntegrationTestCollection.Name)]
public class RepositoryTests
{
    private readonly CustomWebApplicationFactory _factory;

    public RepositoryTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static ApplicationUser NewUser()
    {
        var email = TestUsers.NewEmail();
        return new ApplicationUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = email,
            NormalizedUserName = email.ToUpperInvariant(),
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            FirstName = "Repo",
            LastName = "Test"
        };
    }

    [Fact]
    public async Task InsertGetUpdateDelete_RoundTripsAnEntity()
    {
        using var scope = _factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRepository<ApplicationUser>>();
        var user = NewUser();

        var inserted = await repository.InsertAsync(user);
        Assert.Equal(user.Id, inserted.Id);

        var fetched = await repository.GetAsync(user.Id);
        Assert.NotNull(fetched);
        Assert.Equal(user.FirstName, fetched!.FirstName);

        fetched.FirstName = "Updated";
        var updated = await repository.UpdateAsync(fetched);
        Assert.Equal("Updated", updated.FirstName);

        var refetched = await repository.GetAsync(user.Id);
        Assert.Equal("Updated", refetched!.FirstName);

        await repository.DeleteAsync(user.Id);
        var afterDelete = await repository.GetAsync(user.Id);
        Assert.Null(afterDelete);
    }

    [Fact]
    public async Task GetAsync_WithoutId_ReturnsAllEntitiesIncludingTheInsertedOne()
    {
        using var scope = _factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRepository<ApplicationUser>>();
        var user = NewUser();
        await repository.InsertAsync(user);

        var all = await repository.GetAsync();

        Assert.Contains(all, u => u.Id == user.Id);
    }

    [Fact]
    public async Task FindByConditionAsync_ReturnsTheFirstMatch()
    {
        using var scope = _factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRepository<ApplicationUser>>();
        var user = NewUser();
        await repository.InsertAsync(user);

        var found = await repository.FindByConditionAsync(u => u.Email == user.Email);

        Assert.NotNull(found);
        Assert.Equal(user.Id, found!.Id);
    }

    [Fact]
    public async Task WhereAsync_ReturnsAllMatches()
    {
        using var scope = _factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRepository<ApplicationUser>>();
        var user = NewUser();
        user.LastName = $"WhereTest-{Guid.NewGuid():N}";
        await repository.InsertAsync(user);

        var matches = await repository.WhereAsync(u => u.LastName == user.LastName);

        Assert.Single(matches);
        Assert.Equal(user.Id, matches.First().Id);
    }

    [Fact]
    public async Task DeleteAsync_WithUnknownId_DoesNotThrow()
    {
        using var scope = _factory.Services.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRepository<ApplicationUser>>();

        await repository.DeleteAsync(Guid.NewGuid().ToString());
    }
}
