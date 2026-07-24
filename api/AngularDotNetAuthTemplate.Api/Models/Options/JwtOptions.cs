namespace AngularDotNetAuthTemplate.Api.Models.Options
{
    /// <summary>Configuration for <see cref="Services.JwtHandler"/>, bound from the <see cref="ConfigSection"/> config section.</summary>
    public class JwtOptions
    {
        /// <summary>The configuration section name this options class binds to.</summary>
        public const string ConfigSection = "JwtConfigs";

        /// <summary>The symmetric key used to sign and validate JWTs.</summary>
        public string SecurityKey { get; set; }

        /// <summary>The expected "iss" (issuer) claim value.</summary>
        public string ValidIssuer { get; set; }

        /// <summary>The expected "aud" (audience) claim value.</summary>
        public string ValidAudience { get; set; }

        /// <summary>How many minutes after issuance a token remains valid.</summary>
        public string ExpiryInMinutes { get; set; }
    }
}
