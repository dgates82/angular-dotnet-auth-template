namespace AngularDotNetAuthTemplate.Api.Models.Options
{
    public class SendGridEmailOptions
    {
        public const string ConfigSection = "SendGridEmailConfigs";
        public string ApiKey { get; set; }
        public string FromAddress { get; set; }
        public string FromName { get; set; }
        public string OverrideRecipient { get; set; }
        
    }
}
