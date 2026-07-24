namespace AngularDotNetAuthTemplate.Api.Models.Options;

/// <summary>Configuration for <see cref="Services.TwilioSmsSender"/>, bound from the <see cref="ConfigSection"/> config section.</summary>
public class TwilioSmsOptions
{
    /// <summary>The configuration section name this options class binds to.</summary>
    public const string ConfigSection = "TwilioSmsConfigs";

    /// <summary>The Twilio account SID.</summary>
    public string AccountSid { get; set; }

    /// <summary>The Twilio auth token.</summary>
    public string AuthToken { get; set; }

    /// <summary>The Twilio phone number to send SMS from.</summary>
    public string FromNumber { get; set; }

    /// <summary>When set, all SMS messages are redirected here instead of their real recipient, for testing against a real phone without texting real users.</summary>
    public string OverrideRecipient { get; set; } = "";
}