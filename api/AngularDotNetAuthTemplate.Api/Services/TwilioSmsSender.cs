using AngularDotNetAuthTemplate.Api.Models.Options;
using Microsoft.Extensions.Options;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace AngularDotNetAuthTemplate.Api.Services;

public class TwilioSmsSender : ISmsSender
{
    private readonly IOptions<TwilioSmsOptions> _options;
    private readonly ILogger<TwilioSmsSender> _logger;
    
    public TwilioSmsSender(IOptions<TwilioSmsOptions> options, ILogger<TwilioSmsSender> logger)
    {
        _options = options;
        _logger = logger;
    }
    
    public Task SendSmsAsync(string number, string message)
    {
        _logger.LogDebug($"SendSmsAsync | number: {number} | message: {message}");
        TwilioClient.Init(_options.Value.AccountSid, _options.Value.AuthToken);
        
        // Set number based on override 
        var finalNumber = !string.IsNullOrEmpty(_options.Value.OverrideRecipient) ? _options.Value.OverrideRecipient : number;
        
        _logger.LogDebug($"SendSmsAsync | Final Number: {finalNumber}");
        
        // Include original number in message if override is used
        if (!string.IsNullOrEmpty(_options.Value.OverrideRecipient))
        {
            message += $" - Original Recipient: {number}";
        }
        
        _logger.LogDebug($"SendSmsAsync | Final Message: {message}");
        
        return MessageResource.CreateAsync(
            body: message,
            from: new Twilio.Types.PhoneNumber(_options.Value.FromNumber),
            to: new Twilio.Types.PhoneNumber(finalNumber)
        );
        
    }
    
}