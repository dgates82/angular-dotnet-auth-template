namespace AngularDotNetAuthTemplate.Api.Models.Options
{
    public class SmtpEmailOptions   
    {
        public const string ConfigSection = "SmtpEmailConfigs";
        public string Host { get; set; }
        public string Port { get; set; }
        public string FromAddress { get; set; }
        public string OverrideRecipient { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public bool EnableSsl { get; set; } = true;
    }
}
