namespace AngularAndDotNetCoreAuthTemplate.Models.Options;

public class PostMarkEmailOptions
{
    public const string ConfigSection = "PostMarkEmailConfigs";
    public string ApiKey { get; set; }
    public string FromAddress { get; set; }
    public string OverrideRecipient { get; set; }
}