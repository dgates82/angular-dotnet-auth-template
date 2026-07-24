using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Models.Options;
using AngularDotNetAuthTemplate.Api.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace AngularDotNetAuthTemplate.Api.Tests.Unit;

public class JwtHandlerTests
{
    private static JwtHandler CreateHandler(
        string securityKey = "unit-test-security-key-0123456789",
        string issuer = "TestIssuer",
        string audience = "TestAudience",
        string expiryInMinutes = "60")
    {
        var options = Options.Create(new JwtOptions
        {
            SecurityKey = securityKey,
            ValidIssuer = issuer,
            ValidAudience = audience,
            ExpiryInMinutes = expiryInMinutes
        });

        return new JwtHandler(NullLogger<JwtHandler>.Instance, options);
    }

    [Fact]
    public void GetSigningCredentials_UsesHmacSha256WithConfiguredKey()
    {
        var handler = CreateHandler(securityKey: "super-secret-test-key-0123456789");

        var credentials = handler.GetSigningCredentials();

        Assert.Equal(SecurityAlgorithms.HmacSha256, credentials.Algorithm);
        var key = Assert.IsType<SymmetricSecurityKey>(credentials.Key);
        Assert.Equal("super-secret-test-key-0123456789", Encoding.UTF8.GetString(key.Key));
    }

    [Fact]
    public void GetClaims_IncludesNameClaimAndSerializedUserClaim()
    {
        var handler = CreateHandler();
        var user = new ApplicationUser
        {
            Email = "person@example.com",
            UserName = "person@example.com",
            Roles = new List<string> { "Admin" }
        };

        var claims = handler.GetClaims(user);

        var nameClaim = Assert.Single(claims, c => c.Type == ClaimTypes.Name);
        Assert.Equal("person@example.com", nameClaim.Value);

        var userClaim = Assert.Single(claims, c => c.Type == "user");
        Assert.Equal(JsonClaimValueTypes.Json, userClaim.ValueType);
        Assert.Contains("person@example.com", userClaim.Value);
        Assert.Contains("Admin", userClaim.Value);
    }

    [Fact]
    public void GenerateTokenOptions_SetsIssuerAudienceExpiryAndClaims()
    {
        var handler = CreateHandler(issuer: "MyIssuer", audience: "MyAudience", expiryInMinutes: "120");
        var credentials = handler.GetSigningCredentials();
        var claims = new List<Claim> { new(ClaimTypes.Name, "person@example.com") };
        var before = DateTime.UtcNow;

        var token = handler.GenerateTokenOptions(credentials, claims);

        Assert.Equal("MyIssuer", token.Issuer);
        Assert.Equal("MyAudience", Assert.Single(token.Audiences));
        Assert.Contains(token.Claims, c => c.Type == ClaimTypes.Name && c.Value == "person@example.com");
        Assert.InRange(token.ValidTo, before.AddMinutes(119), before.AddMinutes(121));
    }
}
