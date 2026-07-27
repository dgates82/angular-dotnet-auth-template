using AngularDotNetAuthTemplate.Api.Data;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Infrastructure;

// Points the app at a disposable "AuthTemplateTest" schema on the same MySQL/Mailpit/
// smsmock containers docker-compose.yml already brings up for local dev, so CI only
// needs `docker compose up -d mysql mailpit smsmock` before `dotnet test`. Uses the
// compose file's root credentials (not the app's normal "webapp" user) because that
// user is only granted privileges on the "AuthTemplate" database, not one this factory
// creates/drops.
//
// Program.cs has an explicit Main (not a CreateHostBuilder method or top-level
// statements), so WebApplicationFactory drives it through its "deferred host" path.
// In that path, ConfigureWebHost's ConfigureAppConfiguration callback does not layer
// on top of Program's own WebApplicationBuilder in time - Program.Main still sees the
// unmodified appsettings.json. Environment variables are the one override channel that
// reliably wins, since WebApplication.CreateBuilder always adds AddEnvironmentVariables()
// after appsettings.json/appsettings.{env}.json - the same mechanism the "api" service
// in docker-compose.yml already relies on to point at its containers.
public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private const string TestConnectionString =
        "Server=localhost;Port=3307;Database=AuthTemplateTest;User=root;Password=rootpassword";

    public CustomWebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", TestConnectionString);
        Environment.SetEnvironmentVariable("SmtpEmailConfigs__Host", "localhost");
        Environment.SetEnvironmentVariable("SmtpEmailConfigs__Port", "1025");
        Environment.SetEnvironmentVariable("TwilioSmsConfigs__BaseUrlOverride", "http://localhost:3030");
        Environment.SetEnvironmentVariable("SeedAdmin__Email", "");
        Environment.SetEnvironmentVariable("SeedAdmin__Password", "");
    }

    // Program.Main seeds roles/admin synchronously during host startup, before Run() and
    // before any test code gets a chance to run - so the schema must exist *before* the
    // factory's own Services/CreateClient triggers that startup. Migrate with a standalone
    // context here rather than one resolved from Services, which would trigger the same
    // chicken-and-egg startup this is trying to get ahead of.
    async Task IAsyncLifetime.InitializeAsync()
    {
        // Server-level ops (EnsureDeleted/Migrate open a "no database selected" connection
        // to create/drop AuthTemplateTest as needed) can't use ServerVersion.AutoDetect here:
        // AutoDetect itself connects using the Database=AuthTemplateTest connection string,
        // which fails outright on a first-ever run before that schema exists. docker-compose
        // pins the mysql image to major version 8, so hardcode that instead.
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseMySql(TestConnectionString, new MySqlServerVersion(new Version(8, 0, 0)))
            .Options;

        await using var db = new ApplicationDbContext(options);
        await db.Database.EnsureDeletedAsync();
        await db.Database.MigrateAsync();
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await base.DisposeAsync();
    }
}
