using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Infrastructure;

// Shares one CustomWebApplicationFactory (and one DB reset) across every integration
// test class so the "AuthTemplateTest" schema is only dropped/recreated once per run.
[CollectionDefinition(Name)]
public class IntegrationTestCollection : ICollectionFixture<CustomWebApplicationFactory>
{
    public const string Name = "Integration";
}
