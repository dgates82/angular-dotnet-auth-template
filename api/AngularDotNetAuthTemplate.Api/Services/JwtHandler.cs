using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using AngularDotNetAuthTemplate.Api.ExtensionMethods;
using AngularDotNetAuthTemplate.Api.Models;
using AngularDotNetAuthTemplate.Api.Models.DataTransferObjects.Account;
using AngularDotNetAuthTemplate.Api.Models.Options;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AngularDotNetAuthTemplate.Api.Services
{
    /// <summary>
    /// Builds the signing credentials, claims, and token used to issue JWTs on
    /// successful login. A trimmed <see cref="ApplicationUserDto"/> projection
    /// of the user is embedded as a JSON claim (see <see cref="GetClaims"/>) so
    /// <see cref="AngularDotNetAuthTemplate.Api.Controllers.CustomControllerBase.GetCurrentUser"/>
    /// can reconstruct it without a database round-trip on every request, and
    /// without embedding Identity internals like the password hash in a token
    /// that ends up stored client-side.
    /// </summary>
    public class JwtHandler
    {
        private readonly IOptions<JwtOptions> _options;

        private readonly ILogger _logger;

        /// <summary>Creates the handler with its injected logger and JWT configuration options.</summary>
        public JwtHandler(ILogger<JwtHandler> logger, IOptions<JwtOptions> options)
        {
            _logger = logger;
            _options = options;
        }

        /// <summary>Builds the HMAC-SHA256 signing credentials from the configured security key.</summary>
        public SigningCredentials GetSigningCredentials()
        {
            var key = Encoding.UTF8.GetBytes(_options.Value.SecurityKey);
            var secret = new SymmetricSecurityKey(key);

            return new SigningCredentials(secret, SecurityAlgorithms.HmacSha256);
        }

        /// <summary>
        /// Builds the claims for a token: the user's name, plus a trimmed user
        /// projection serialized as a JSON claim so it can be reconstructed from
        /// the token alone, without embedding Identity internals like the
        /// password hash or security stamp.
        /// </summary>
        public List<Claim> GetClaims(ApplicationUser user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.Email),
                new Claim("user", new ApplicationUserDto(user).ToJson(), JsonClaimValueTypes.Json)
            };

            return claims;
        }


        /// <summary>Builds the signed JWT with the configured issuer, audience, and expiry.</summary>
        public JwtSecurityToken GenerateTokenOptions(SigningCredentials signingCredentials, List<Claim> claims)
        {
            var tokenOptions = new JwtSecurityToken(
                issuer: _options.Value.ValidIssuer,
                audience: _options.Value.ValidAudience,
                claims: claims,
                expires: DateTime.Now.AddMinutes(Convert.ToDouble(_options.Value.ExpiryInMinutes)),
                signingCredentials: signingCredentials);
            
            return tokenOptions;
        }

    }
}
