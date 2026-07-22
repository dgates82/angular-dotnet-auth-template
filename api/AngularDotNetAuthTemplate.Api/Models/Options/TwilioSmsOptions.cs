namespace AngularDotNetAuthTemplate.Api.Models.Options;

public class TwilioSmsOptions
{
    public const string ConfigSection = "TwilioSmsConfigs";
    public string AccountSid { get; set; }
    public string AuthToken { get; set; }
    public string FromNumber { get; set; }
    public string OverrideRecipient { get; set; } = "";
}