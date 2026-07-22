namespace AngularDotNetAuthTemplate.Api.Models.Options
{
    public class JwtOptions
    {
        public const string ConfigSection = "JwtConfigs";
        public string SecurityKey { get; set; }
        public string ValidIssuer { get; set; }
        public string ValidAudience { get; set; }
        public string ExpiryInMinutes { get; set; }
    }
}
