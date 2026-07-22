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
    public class JwtHandler
    {
        private readonly IOptions<JwtOptions> _options;

        private readonly ILogger _logger;

        public JwtHandler(ILogger<JwtHandler> logger, IOptions<JwtOptions> options)
        {
            _logger = logger;
            _options = options;
        }

        public SigningCredentials GetSigningCredentials()
        {
            var key = Encoding.UTF8.GetBytes(_options.Value.SecurityKey);
            var secret = new SymmetricSecurityKey(key);

            return new SigningCredentials(secret, SecurityAlgorithms.HmacSha256);
        }

        public List<Claim> GetClaims(ApplicationUser user) 
        { 
            var claims = new List<Claim> 
            {
                new Claim(ClaimTypes.Name, user.Email),
                new Claim("user", user.ToJson(), JsonClaimValueTypes.Json)
            };                       

            return claims;
        }


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
